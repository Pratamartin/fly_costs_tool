import type { ExpenseWithRelations } from '@/services/expense.service'
import { Prisma } from '@/generated/prisma/client'
import { getOneLinerUniqueProjectsFromBreakdowns } from './report-formatter.logic'

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

export function calculateReportAnalytics(expenses: ExpenseWithRelations[], projectIdFilter?: string): ReportAnalytics {
  const analytics: ReportAnalytics = {
    totalAmount: new Prisma.Decimal(0),
    totalRequests: expenses.length,
    byCategory: {},
    byProject: {},
  }

  for (const expense of expenses) {
    const relevantBreakdowns = projectIdFilter
      ? expense.costBreakdowns.filter(cb => cb.projectId === projectIdFilter)
      : expense.costBreakdowns

    if (!relevantBreakdowns || relevantBreakdowns.length === 0) {
      const projectKey = 'unassigned'
      if (!analytics.byProject[projectKey]) {
        analytics.byProject[projectKey] = {
          projectCode: 'N/A',
          projectName: 'Não Atribuído',
          total: new Prisma.Decimal(0),
          requestCount: 0,
        }
      }
      analytics.byProject[projectKey].requestCount++
    }
    else {
      const projectsInExpense = new Set<string>()

      for (const cb of relevantBreakdowns) {
        const projectKey = cb.projectId

        if (!analytics.byProject[projectKey]) {
          const { names, codes } = getOneLinerUniqueProjectsFromBreakdowns([cb])
          analytics.byProject[projectKey] = {
            projectCode: codes,
            projectName: names,
            total: new Prisma.Decimal(0),
            requestCount: 0,
          }
        }

        const projectStats = analytics.byProject[projectKey]
        if (!projectsInExpense.has(projectKey)) {
          projectStats.requestCount++
          projectsInExpense.add(projectKey)
        }
        projectStats.total = projectStats.total.add(cb.amount)
      }
    }

    for (const cb of relevantBreakdowns) {
      const amount = cb.amount
      const categoryName = cb.expenseCategory.name

      analytics.totalAmount = analytics.totalAmount.add(amount)

      if (!analytics.byCategory[categoryName]) {
        analytics.byCategory[categoryName] = new Prisma.Decimal(0)
      }
      analytics.byCategory[categoryName] = analytics.byCategory[categoryName].add(amount)
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
