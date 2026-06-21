import type { z } from '@hono/zod-openapi'
import type { ServiceResult } from '@/lib/problems'
import type { CreateCostBreakdownSchema } from '@/schemas/cost-breakdown.schema'
import { ALLOWED_STATUSES_FOR_COST_ALLOCATION } from '@/constants/expense.constant'
import { COST_BREAKDOWN_RECEIPT_DOWNLOAD_URL_EXPIRY_SECONDS } from '@/constants/file.constant'
import { Prisma } from '@/generated/prisma/client'
import { ExpenseRequestStatus, UserRole } from '@/generated/prisma/enums'
import { logger } from '@/lib/logger'
import prisma from '@/lib/orm'
import { deleteFile, getSignedDownloadUrl, isStorageConfigured, uploadFile } from '@/lib/storage'

type BudgetMetricsResult = { total: Prisma.Decimal, used: Prisma.Decimal, available: Prisma.Decimal, isActive: boolean }

export type CostBreakdownWithCategory = Prisma.CostBreakdownGetPayload<{ include: { expenseCategory: true } }>

export async function getProjectBudgetMetrics(projectId: string): Promise<ServiceResult<BudgetMetricsResult, 'PROJECT_NOT_FOUND'>> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      budget: true,
      usedBudget: true,
      isActive: true,
    },
  })

  if (!project)
    return { error: 'PROJECT_NOT_FOUND' }

  return {
    total: project.budget,
    used: project.usedBudget,
    available: project.budget.minus(project.usedBudget),
    isActive: project.isActive,
  }
}

export function validateCategoryAllowedInProject(
  projectCategories: { normalizedName: string }[],
  requestedCategory: string,
): ServiceResult<{ success: true }, 'INVALID_SUBCATEGORIES'> {
  const validCategories = projectCategories.map(c => c.normalizedName)
  if (!validCategories.includes(requestedCategory)) {
    return { error: 'INVALID_SUBCATEGORIES' }
  }
  return { success: true }
}

export function validateSufficientBudget(
  totalBudget: Prisma.Decimal,
  usedBudget: Prisma.Decimal,
  requestedAmount: number | Prisma.Decimal,
  oldAmount: number | Prisma.Decimal = 0,
): ServiceResult<{ success: true }, 'PROJECT_INSUFFICIENT_FUNDS'> {
  const available = totalBudget.minus(usedBudget).plus(oldAmount)
  const requested = new Prisma.Decimal(requestedAmount)

  if (requested.greaterThan(available)) {
    return { error: 'PROJECT_INSUFFICIENT_FUNDS' }
  }
  return { success: true }
}

export function extractUniqueProjectDetails(
  costBreakdowns?: Array<{ project?: { name: string, code: string } | null } | null> | null,
) {
  if (!costBreakdowns || costBreakdowns.length === 0) {
    return {
      names: 'Não Atribuído',
      codes: 'N/A',
    }
  }

  const validBreakdowns = costBreakdowns.filter((cb): cb is NonNullable<typeof cb> => cb != null)

  const names = [...new Set(validBreakdowns.map(cb => cb.project?.name).filter((n): n is string => !!n))]
  const codes = [...new Set(validBreakdowns.map(cb => cb.project?.code).filter((c): c is string => !!c))]

  return {
    names: names.length > 0 ? names.join(', ') : 'Não Atribuído',
    codes: codes.length > 0 ? codes.join(', ') : 'N/A',
  }
}

export async function createCostBreakdown(
  expenseId: string,
  data: z.infer<typeof CreateCostBreakdownSchema>,
): Promise<ServiceResult<CostBreakdownWithCategory, 'EXPENSE_NOT_FOUND' | 'PROJECT_NOT_FOUND' | 'PROJECT_ARCHIVED' | 'INVALID_SUBCATEGORIES' | 'PROJECT_INSUFFICIENT_FUNDS' | 'INVALID_EXPENSE_STATE'>> {
  const result = await prisma.$transaction(async (tx) => {
    const [expense, project, pendingAmountResult] = await Promise.all([
      tx.expenseRequest.findUnique({
        where: { id: expenseId },
        select: {
          id: true,
          status: true,
        },
      }),
      tx.project.findUnique({
        where: { id: data.projectId },
        select: {
          id: true,
          budget: true,
          usedBudget: true,
          expenseCategories: { select: { normalizedName: true } },
          isActive: true,
        },
      }),
      tx.costBreakdown.aggregate({
        where: {
          projectId: data.projectId,
          expenseRequest: { status: { in: [ExpenseRequestStatus.EM_PROCESSAMENTO] } },
        },
        _sum: { amount: true },
      }),
    ])

    if (!expense) {
      return { error: 'EXPENSE_NOT_FOUND' }
    }

    if (!ALLOWED_STATUSES_FOR_COST_ALLOCATION.includes(expense.status)) {
      return {
        error: 'INVALID_EXPENSE_STATE',
        context: {
          resourceState: {
            current: expense.status,
            required: ALLOWED_STATUSES_FOR_COST_ALLOCATION,
          },
        },
      }
    }

    if (!project) {
      return { error: 'PROJECT_NOT_FOUND' }
    }

    if (!project.isActive) {
      return { error: 'PROJECT_ARCHIVED' }
    }


    const categoryResult = validateCategoryAllowedInProject(project.expenseCategories, data.subcategoryName)
    if ('error' in categoryResult) {
      return categoryResult
    }

    // Calcular saldo considerando o que já foi gasto e o que está em processamento
    const effectiveUsedBudget = project.usedBudget.plus(pendingAmountResult._sum.amount ?? 0)

    const budgetResult = validateSufficientBudget(project.budget, effectiveUsedBudget, data.amount)
    if ('error' in budgetResult) {
      return budgetResult
    }

    const costBreakdown = await tx.costBreakdown.create({
      data: {
        amount: data.amount,
        expenseRequest: { connect: { id: expenseId } },
        expenseCategory: { connect: { normalizedName: data.subcategoryName } },
        project: { connect: { id: data.projectId } },
        attachmentKey: data.attachmentKey,
      },
      include: { expenseCategory: true },
    })

    return costBreakdown
  }, { isolationLevel: 'Serializable' })

  return result as ServiceResult<CostBreakdownWithCategory, 'EXPENSE_NOT_FOUND' | 'PROJECT_NOT_FOUND' | 'PROJECT_ARCHIVED' | 'INVALID_SUBCATEGORIES' | 'PROJECT_INSUFFICIENT_FUNDS' | 'INVALID_EXPENSE_STATE'>
}

export async function uploadCostBreakdownReceipt(
  expenseId: string,
  breakdownId: string,
  file: File,
): Promise<ServiceResult<CostBreakdownWithCategory, 'STORAGE_UNAVAILABLE' | 'COST_BREAKDOWN_NOT_FOUND' | 'STORAGE_PROVIDER_ERROR'>> {
  if (!isStorageConfigured()) {
    return { error: 'STORAGE_UNAVAILABLE' }
  }

  const breakdown = await prisma.costBreakdown.findUnique({
    where: {
      id: breakdownId,
      expenseRequestId: expenseId,
    },
  })

  if (!breakdown) {
    return { error: 'COST_BREAKDOWN_NOT_FOUND' }
  }

  if (breakdown.attachmentKey) {
    try {
      await deleteFile(breakdown.attachmentKey)
    }
    catch (error) {
      logger.error(error, 'Failed to delete previous file from R2:')
      return { error: 'STORAGE_PROVIDER_ERROR' }
    }
  }

  try {
    const uploadResult = await uploadFile({
      file,
      contentType: file.type,
      folder: 'comprovantes',
      subfolder: expenseId,
      prefix: breakdownId,
    })

    return await prisma.costBreakdown.update({
      where: { id: breakdownId },
      data: { attachmentKey: uploadResult.fileKey },
      include: { expenseCategory: true },
    })
  }
  catch (error) {
    logger.error(error, 'R2 Upload error:')
    return { error: 'STORAGE_PROVIDER_ERROR' }
  }
}

export async function deleteCostBreakdownReceipt(
  expenseId: string,
  breakdownId: string,
): Promise<ServiceResult<{ success: true }, 'STORAGE_UNAVAILABLE' | 'COST_BREAKDOWN_NOT_FOUND' | 'RECEIPT_NOT_FOUND' | 'STORAGE_PROVIDER_ERROR'>> {
  if (!isStorageConfigured()) {
    return { error: 'STORAGE_UNAVAILABLE' }
  }

  const breakdown = await prisma.costBreakdown.findUnique({
    where: {
      id: breakdownId,
      expenseRequestId: expenseId,
    },
  })

  if (!breakdown) {
    return { error: 'COST_BREAKDOWN_NOT_FOUND' }
  }

  if (!breakdown.attachmentKey) {
    return { error: 'RECEIPT_NOT_FOUND' }
  }

  try {
    await deleteFile(breakdown.attachmentKey)

    await prisma.costBreakdown.update({
      where: { id: breakdownId },
      data: { attachmentKey: null },
    })

    return { success: true }
  }
  catch (error) {
    logger.error(error, 'R2 Delete error:')
    return { error: 'STORAGE_PROVIDER_ERROR' }
  }
}

export async function getCostBreakdownReceiptUrl(
  expenseId: string,
  breakdownId: string,
  userId: string,
  role: UserRole,
): Promise<ServiceResult<{ url: string, expiresIn: number }, 'EXPENSE_NOT_FOUND' | 'COST_BREAKDOWN_NOT_FOUND' | 'RECEIPT_NOT_FOUND' | 'FORBIDDEN' | 'STORAGE_UNAVAILABLE' | 'STORAGE_PROVIDER_ERROR'>> {
  const expense = await prisma.expenseRequest.findUnique({
    where: { id: expenseId },
    select: { studentId: true },
  })

  if (!expense) {
    return { error: 'EXPENSE_NOT_FOUND' }
  }

  if (role !== UserRole.ADMIN && expense.studentId !== userId) {
    return { error: 'FORBIDDEN' }
  }

  const breakdown = await prisma.costBreakdown.findUnique({
    where: {
      id: breakdownId,
      expenseRequestId: expenseId,
    },
  })

  if (!breakdown) {
    return { error: 'COST_BREAKDOWN_NOT_FOUND' }
  }

  if (!breakdown.attachmentKey) {
    return { error: 'RECEIPT_NOT_FOUND' }
  }

  if (!isStorageConfigured()) {
    return { error: 'STORAGE_UNAVAILABLE' }
  }

  try {
    const url = await getSignedDownloadUrl(breakdown.attachmentKey, COST_BREAKDOWN_RECEIPT_DOWNLOAD_URL_EXPIRY_SECONDS)
    return {
      url,
      expiresIn: COST_BREAKDOWN_RECEIPT_DOWNLOAD_URL_EXPIRY_SECONDS,
    }
  }
  catch (error) {
    logger.error(error, 'R2 Pre-sign error:')
    return { error: 'STORAGE_PROVIDER_ERROR' }
  }
}
