import type { z } from '@hono/zod-openapi'
import type { ServiceResult } from '@/lib/problems'
import type { CreateCostBreakdownSchema } from '@/schemas/cost-breakdown.schema'
import { COST_BREAKDOWN_RECEIPT_DOWNLOAD_URL_EXPIRY_SECONDS } from '@/constants/file.constant'
import { Prisma } from '@/generated/prisma/client'
import { UserRole } from '@/generated/prisma/enums'
import { logger } from '@/lib/logger'
import prisma from '@/lib/orm'
import { deleteFile, getSignedDownloadUrl, isStorageConfigured, uploadFile } from '@/lib/storage'

type BudgetMetricsResult = { total: Prisma.Decimal, used: Prisma.Decimal, available: Prisma.Decimal, isActive: boolean }

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

async function getExpenseContext(tx: Prisma.TransactionClient, expenseRequestId: string) {
  return tx.expenseRequest.findUnique({
    where: { id: expenseRequestId },
    select: {
      project: {
        select: {
          id: true,
          budget: true,
          usedBudget: true,
          expenseCategories: { select: { normalizedName: true } },
          isActive: true,
        },
      },
    },
  })
}

export type CostBreakdownWithCategory = Prisma.CostBreakdownGetPayload<{ include: { expenseCategory: true } }>

export async function createCostBreakdown(
  expenseRequestId: string,
  data: z.infer<typeof CreateCostBreakdownSchema>,
): Promise<ServiceResult<CostBreakdownWithCategory, 'EXPENSE_NOT_FOUND' | 'PROJECT_NOT_FOUND' | 'PROJECT_ARCHIVED' | 'INVALID_SUBCATEGORIES' | 'PROJECT_INSUFFICIENT_FUNDS'>> {
  const result = await prisma.$transaction(async (tx) => {
    const expense = await getExpenseContext(tx, expenseRequestId)

    if (!expense) {
      return { error: 'EXPENSE_NOT_FOUND' }
    }

    if (!expense.project) {
      return { error: 'PROJECT_NOT_FOUND' }
    }

    const project = expense.project

    if (!project.isActive) {
      return { error: 'PROJECT_ARCHIVED' }
    }

    const categoryResult = validateCategoryAllowedInProject(project.expenseCategories, data.subcategoryName)
    if ('error' in categoryResult) {
      return categoryResult
    }

    const budgetResult = validateSufficientBudget(project.budget, project.usedBudget, data.amount)
    if ('error' in budgetResult) {
      return budgetResult
    }

    const costBreakdown = await tx.costBreakdown.create({
      data: {
        amount: data.amount,
        expenseRequest: { connect: { id: expenseRequestId } },
        expenseCategory: { connect: { normalizedName: data.subcategoryName } },
        attachmentKey: data.attachmentKey,
      },
      include: { expenseCategory: true },
    })

    await tx.project.update({
      where: { id: project.id },
      data: { usedBudget: { increment: new Prisma.Decimal(data.amount) } },
    })

    return costBreakdown
  }, { isolationLevel: 'Serializable' })

  return result as ServiceResult<CostBreakdownWithCategory, 'EXPENSE_NOT_FOUND' | 'PROJECT_NOT_FOUND' | 'PROJECT_ARCHIVED' | 'INVALID_SUBCATEGORIES' | 'PROJECT_INSUFFICIENT_FUNDS'>
}

export async function uploadCostBreakdownReceipt(
  expenseId: string,
  breakdownId: string,
  file: File,
): Promise<ServiceResult<CostBreakdownWithCategory, 'STORAGE_UNAVAILABLE' | 'COST_BREAKDOWN_NOT_FOUND' | 'STORAGE_PROVIDER_ERROR'>> {
  if (!isStorageConfigured()) {
    return { error: 'STORAGE_UNAVAILABLE' }
  }

  const breakdown = await prisma.costBreakdown.findFirst({
    where: {
      id: breakdownId,
      expenseRequestId: expenseId,
    },
    include: { expenseCategory: true },
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
    const uploaded = await uploadFile({
      file,
      contentType: file.type,
      folder: 'comprovantes',
      subfolder: expenseId,
      prefix: breakdown.expenseCategory.normalizedName,
    })

    const updatedBreakdown = await prisma.costBreakdown.update({
      where: { id: breakdownId },
      data: { attachmentKey: uploaded.fileKey },
      include: { expenseCategory: true },
    })

    return updatedBreakdown
  }
  catch (error) {
    logger.error(error, 'R2 Upload error:')
    return { error: 'STORAGE_PROVIDER_ERROR' }
  }
}

export async function deleteCostBreakdownReceipt(
  expenseId: string,
  breakdownId: string,
): Promise<ServiceResult<{ success: true }, 'COST_BREAKDOWN_NOT_FOUND' | 'RECEIPT_NOT_FOUND' | 'STORAGE_PROVIDER_ERROR'>> {
  const breakdown = await prisma.costBreakdown.findFirst({
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
): Promise<ServiceResult<{ url: string, expiresIn: number }, 'STORAGE_UNAVAILABLE' | 'COST_BREAKDOWN_NOT_FOUND' | 'RECEIPT_NOT_FOUND' | 'STORAGE_PROVIDER_ERROR'>> {
  if (!isStorageConfigured()) {
    return { error: 'STORAGE_UNAVAILABLE' }
  }

  const breakdown = await prisma.costBreakdown.findFirst({
    where: {
      id: breakdownId,
      expenseRequestId: expenseId,
      ...(role !== UserRole.ADMIN && { expenseRequest: { studentId: userId } }),
    },
    select: { attachmentKey: true },
  })

  if (!breakdown) {
    return { error: 'COST_BREAKDOWN_NOT_FOUND' }
  }

  if (!breakdown.attachmentKey) {
    return { error: 'RECEIPT_NOT_FOUND' }
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
