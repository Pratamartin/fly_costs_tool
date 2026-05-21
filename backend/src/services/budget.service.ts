import type { z } from '@hono/zod-openapi'
import type { CreateCostBreakdownSchema } from '@/schemas/cost-breakdown.schema'
import * as phrases from 'stoker/http-status-phrases'
import { COST_BREAKDOWN_RECEIPT_DOWNLOAD_URL_EXPIRY_SECONDS } from '@/constants/file.constant'
import { PROJECT_ERROR_CODES } from '@/constants/project.constant'
import { Prisma } from '@/generated/prisma/client'
import { UserRole } from '@/generated/prisma/enums'
import { logger } from '@/lib/logger'
import prisma from '@/lib/orm'
import { deleteFile, getSignedDownloadUrl, isStorageConfigured, uploadFile } from '@/lib/storage'

type BudgetMetricsResult = { total: Prisma.Decimal, used: Prisma.Decimal, available: Prisma.Decimal, isActive: boolean }

export async function getProjectBudgetMetrics(projectId: string): Promise<BudgetMetricsResult | { error: string }> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      budget: true,
      usedBudget: true,
      isActive: true,
    },
  })

  if (!project)
    return { error: phrases.NOT_FOUND }

  return {
    total: project.budget,
    used: project.usedBudget,
    available: project.budget.minus(project.usedBudget),
    isActive: project.isActive,
  }
}

export function isCategoryAllowedInProject(
  projectCategories: { normalizedName: string }[],
  requestedCategory: string,
): boolean {
  const validCategories = projectCategories.map(c => c.normalizedName)
  return validCategories.includes(requestedCategory)
}

export function hasSufficientBudget(
  totalBudget: Prisma.Decimal,
  usedBudget: Prisma.Decimal,
  requestedAmount: number | Prisma.Decimal,
  oldAmount: number | Prisma.Decimal = 0,
): boolean {
  const available = totalBudget.minus(usedBudget).plus(oldAmount)
  const requested = new Prisma.Decimal(requestedAmount)

  return requested.lessThanOrEqualTo(available)
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

export async function createCostBreakdown(
  expenseRequestId: string,
  data: z.infer<typeof CreateCostBreakdownSchema>,
) {
  const result = await prisma.$transaction(async (tx) => {
    const expense = await getExpenseContext(tx, expenseRequestId)

    if (!expense || !expense.project) {
      return { error: phrases.NOT_FOUND }
    }

    const project = expense.project

    if (!project.isActive) {
      return { error: PROJECT_ERROR_CODES.PROJECT_ARCHIVED }
    }

    if (!isCategoryAllowedInProject(project.expenseCategories, data.subcategoryName)) {
      return { error: PROJECT_ERROR_CODES.INVALID_SUBCATEGORIES_COUNT }
    }

    if (!hasSufficientBudget(project.budget, project.usedBudget, data.amount)) {
      return { error: PROJECT_ERROR_CODES.INSUFFICIENT_FUNDS }
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

  return result
}

export async function uploadCostBreakdownReceipt(
  expenseId: string,
  breakdownId: string,
  file: File,
) {
  if (!isStorageConfigured()) {
    return { error: 'STORAGE_NOT_CONFIGURED' }
  }

  const breakdown = await prisma.costBreakdown.findFirst({
    where: {
      id: breakdownId,
      expenseRequestId: expenseId,
    },
    include: { expenseCategory: true },
  })

  if (!breakdown) {
    return { error: phrases.NOT_FOUND }
  }

  if (breakdown.attachmentKey) {
    try {
      await deleteFile(breakdown.attachmentKey)
    }
    catch (error) {
      logger.error(error, 'Failed to delete previous file from R2:')
      return { error: phrases.BAD_GATEWAY }
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
    return { error: phrases.BAD_GATEWAY }
  }
}

export async function deleteCostBreakdownReceipt(
  expenseId: string,
  breakdownId: string,
) {
  const breakdown = await prisma.costBreakdown.findFirst({
    where: {
      id: breakdownId,
      expenseRequestId: expenseId,
    },
  })

  if (!breakdown || !breakdown.attachmentKey) {
    return { error: phrases.NOT_FOUND }
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
    return { error: phrases.BAD_GATEWAY }
  }
}

export async function getCostBreakdownReceiptUrl(
  expenseId: string,
  breakdownId: string,
  userId: string,
  role: UserRole,
) {
  if (!isStorageConfigured()) {
    return { error: 'STORAGE_NOT_CONFIGURED' }
  }

  const breakdown = await prisma.costBreakdown.findFirst({
    where: {
      id: breakdownId,
      expenseRequestId: expenseId,
      ...(role !== UserRole.ADMIN && { expenseRequest: { studentId: userId } }),
    },
    select: { attachmentKey: true },
  })

  if (!breakdown || !breakdown.attachmentKey) {
    return { error: phrases.NOT_FOUND }
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
    return { error: phrases.BAD_GATEWAY }
  }
}
