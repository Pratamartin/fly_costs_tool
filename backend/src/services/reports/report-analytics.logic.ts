import type { ExpenseWithRelations } from '@/services/expense.service'
import { Prisma } from '@/generated/prisma/client'

export type ProjectAnalytics = {
  projectCode: string
  projectName: string
  total: Prisma.Decimal
  requestCount: number
}

export type ReportAnalytics = {
  totalAmount: Prisma.Decimal
  totalRequests: number
  byCategory: Record<string, Prisma.Decimal>
  byProject: Record<string, ProjectAnalytics>
}

export function calculateReportAnalytics(expenses: ExpenseWithRelations[]): ReportAnalytics {
  const analytics: ReportAnalytics = {
    totalAmount: new Prisma.Decimal(0),
    totalRequests: expenses.length,
    byCategory: {},
    byProject: {},
  }

  for (const expense of expenses) {
    const projectKey = expense.projectId || 'unassigned'

    if (!analytics.byProject[projectKey]) {
      analytics.byProject[projectKey] = {
        projectCode: expense.project?.code || 'N/A',
        projectName: expense.project?.name || 'Não Atribuído',
        total: new Prisma.Decimal(0),
        requestCount: 0,
      }
    }

    const projectStats = analytics.byProject[projectKey]
    projectStats.requestCount++

    for (const cb of expense.costBreakdowns) {
      const amount = cb.amount
      const categoryName = cb.expenseCategory.name

      analytics.totalAmount = analytics.totalAmount.add(amount)

      if (!analytics.byCategory[categoryName]) {
        analytics.byCategory[categoryName] = new Prisma.Decimal(0)
      }
      analytics.byCategory[categoryName] = analytics.byCategory[categoryName].add(amount)

      projectStats.total = projectStats.total.add(amount)
    }
  }

  return analytics
}

export function getTopExpenseCategories(
  categoryTotals: Record<string, Prisma.Decimal>,
  limit: number = 3,
): [categoryName: string, total: Prisma.Decimal][] {
  return Object.entries(categoryTotals)
    .sort(([_nameA, amountA], [_nameB, amountB]) => amountB.comparedTo(amountA))
    .slice(0, limit)
}
