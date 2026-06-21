import { DEFAULT_TOP_PROJECTS_COUNT } from '@/constants/analytics.constant'
import { Prisma } from '@/generated/prisma/client'
import { ExpenseRequestStatus } from '@/generated/prisma/enums'
import prisma from '@/lib/orm'

export async function getAdminDashboardStats() {
  const [countResult, statusGroups] = await Promise.all([
    prisma.expenseRequest.count(),

    prisma.expenseRequest.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
  ])

  const projectBudgetStats = await prisma.project.aggregate({
    _sum: {
      budget: true,
      usedBudget: true,
    },
  })

  // budgetCommitted no Dashboard representa o que já foi gasto (usedBudget)
  // MAIS o que está prometido em discriminações de despesas EM_PROCESSAMENTO.
  const pendingBreakdowns = await prisma.costBreakdown.aggregate({
    where: { expenseRequest: { status: ExpenseRequestStatus.EM_PROCESSAMENTO } },
    _sum: { amount: true },
  })

  const realized = projectBudgetStats._sum.usedBudget || new Prisma.Decimal(0)
  const pending = pendingBreakdowns._sum.amount || new Prisma.Decimal(0)

  const byStatus = statusGroups.reduce((acc, curr) => {
    acc[curr.status] = curr._count.id
    return acc
  }, {} as Record<string, number>)

  return {
    totalRequests: countResult,
    byStatus,
    totalValue: projectBudgetStats._sum.budget || 0,
    budgetCommitted: realized.plus(pending),
  }
}

export async function getTopProjects(limit?: number) {
  const take = limit || DEFAULT_TOP_PROJECTS_COUNT

  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { usedBudget: { gt: 0 } },
        { costBreakdowns: { some: { expenseRequest: { status: ExpenseRequestStatus.EM_PROCESSAMENTO } } } },
      ],
    },
    select: {
      id: true,
      name: true,
      usedBudget: true,
      _count: { select: { costBreakdowns: true } },
    },
    orderBy: [
      { usedBudget: 'desc' },
      { costBreakdowns: { _count: 'desc' } },
    ],
    take,
  })

  return projects.map(project => ({
    id: project.id,
    name: project.name,
    totalRequests: project._count.costBreakdowns,
    totalValue: project.usedBudget || 0,
  }))
}
