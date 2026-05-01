import type { z } from '@hono/zod-openapi'
import type { CreateCostBreakdownSchema } from '@/schemas/cost-breakdown.schema'
import * as phrases from 'stoker/http-status-phrases'
import { PROJECT_ERROR_CODES } from '@/constants/project.constant'
import { Prisma } from '@/generated/prisma/client'
import prisma from '@/lib/orm'

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
