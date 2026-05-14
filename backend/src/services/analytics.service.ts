import { DEFAULT_TOP_PROJECTS_COUNT } from '@/constants/analytics.constant'
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

  const budgetCommitted = await prisma.project.aggregate({
    where: { expenseRequests: { some: { status: { in: [ExpenseRequestStatus.APROVADO, ExpenseRequestStatus.EM_PROCESSAMENTO, ExpenseRequestStatus.CONCLUIDO] } } } },
    _sum: { usedBudget: true },
  })

  const byStatus = statusGroups.reduce((acc, curr) => {
    acc[curr.status] = curr._count.id
    return acc
  }, {} as Record<string, number>)

  return {
    totalRequests: countResult,
    byStatus,
    totalValue: projectBudgetStats._sum.budget || 0,
    budgetCommitted: budgetCommitted._sum.usedBudget || 0,
  }
}

export async function getTopProjects(limit?: number) {
  const take = limit || DEFAULT_TOP_PROJECTS_COUNT

  const projects = await prisma.project.findMany({
    where: { expenseRequests: { some: { status: { in: [ExpenseRequestStatus.APROVADO, ExpenseRequestStatus.EM_PROCESSAMENTO, ExpenseRequestStatus.CONCLUIDO] } } } },
    select: {
      id: true,
      name: true,
      usedBudget: true,
      _count: { select: { expenseRequests: true } },
    },
    orderBy: [
      { usedBudget: 'desc' },
      { expenseRequests: { _count: 'desc' } },
    ],
    take,
  })

  return projects.map(project => ({
    id: project.id,
    name: project.name,
    totalRequests: project._count.expenseRequests,
    totalValue: project.usedBudget || 0,
  }))
}
