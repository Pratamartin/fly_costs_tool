import { DEFAULT_TOP_PROJECTS_COUNT } from '@/constants/analytics.constant'
import { ALLOWED_STATUSES_FOR_COST_ALLOCATION } from '@/constants/expense.constant'
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

/**
 * Retorna o ranking de projetos baseado no volume financeiro total comprometido.
 *
 * @businessRule O valor total (totalValue) reflete a soma do orçamento já executado
 * (`usedBudget`) com os custos de despesas que estão retidas aguardando liquidação
 * (`EM_PROCESSAMENTO`).
 * @businessRule A contagem de alocações (`allocationsCount`) ignora propositalmente
 * quebras de custos atreladas a requisições REJEITADAS, CANCELADAS ou RASCUNHOS para
 * evitar poluição estatística ("Lixo Estatístico").
 */
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
      costBreakdowns: {
        where: { expenseRequest: { status: ExpenseRequestStatus.EM_PROCESSAMENTO } },
        select: { amount: true },
      },
      _count: { select: { costBreakdowns: { where: { expenseRequest: { status: { in: [...ALLOWED_STATUSES_FOR_COST_ALLOCATION, 'CONCLUIDO'] } } } } } },
    },
  })

  // Calcula o valor comprometido real e o ranking em memória
  const rankedProjects = projects.map((project) => {
    const processingAmount = project.costBreakdowns.reduce(
      (acc, curr) => acc.plus(curr.amount),
      new Prisma.Decimal(0),
    )
    const committedValue = (project.usedBudget || new Prisma.Decimal(0)).plus(processingAmount)

    return {
      id: project.id,
      name: project.name,
      allocationsCount: project._count.costBreakdowns,
      totalValue: committedValue,
    }
  })

  // Ordena pelo valor comprometido decrescente; em caso de empate, pelo allocationsCount
  rankedProjects.sort((a, b) => {
    const diff = b.totalValue.cmp(a.totalValue)
    if (diff !== 0)
      return diff
    return b.allocationsCount - a.allocationsCount
  })

  return rankedProjects.slice(0, take).map(p => ({
    ...p,
    totalValue: p.totalValue.toString(),
  }))
}
