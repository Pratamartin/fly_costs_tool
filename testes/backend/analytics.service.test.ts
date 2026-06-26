import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ExpenseRequestStatus } from '@/generated/prisma/enums'
import { Prisma } from '@/generated/prisma/client'
import { getAdminDashboardStats, getTopProjects } from '@/services/analytics.service'

const prismaMock = vi.hoisted(() => ({
  expenseRequest: {
    count: vi.fn(),
    groupBy: vi.fn(),
  },
  project: {
    aggregate: vi.fn(),
    findMany: vi.fn(),
  },
  costBreakdown: {
    aggregate: vi.fn(),
  },
}))

vi.mock('@/lib/orm', () => ({ default: prismaMock }))

describe('analytics.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getAdminDashboardStats agrega totais e métricas de budget', async () => {
    prismaMock.expenseRequest.count.mockResolvedValue(42)
    prismaMock.expenseRequest.groupBy.mockResolvedValue([
      { status: ExpenseRequestStatus.PENDENTE, _count: { id: 20 } },
      { status: ExpenseRequestStatus.APROVADO, _count: { id: 15 } },
      { status: ExpenseRequestStatus.EM_PROCESSAMENTO, _count: { id: 7 } },
    ])
    prismaMock.project.aggregate
      .mockResolvedValueOnce({
        _sum: { budget: new Prisma.Decimal(100_000), usedBudget: new Prisma.Decimal(35_000) },
      })
    prismaMock.costBreakdown.aggregate.mockResolvedValueOnce({
      _sum: { amount: new Prisma.Decimal(12_500) },
    })

    const stats = await getAdminDashboardStats()

    expect(stats.totalRequests).toBe(42)
    expect(stats.byStatus.PENDENTE).toBe(20)
    expect(stats.byStatus.APROVADO).toBe(15)
    expect(stats.byStatus.EM_PROCESSAMENTO).toBe(7)
    expect(stats.totalValue.toNumber()).toBe(100_000)
    expect(stats.budgetCommitted.toNumber()).toBe(47_500)
    expect(prismaMock.project.aggregate).toHaveBeenCalledTimes(1)
    expect(prismaMock.costBreakdown.aggregate).toHaveBeenCalledTimes(1)
  })

  it('groupBy alimenta todas as chaves de status presentes no resultado', async () => {
    prismaMock.expenseRequest.count.mockResolvedValue(3)
    prismaMock.expenseRequest.groupBy.mockResolvedValue([
      { status: ExpenseRequestStatus.REJEITADO, _count: { id: 3 } },
    ])
    prismaMock.project.aggregate
      .mockResolvedValueOnce({ _sum: { budget: 0, usedBudget: 0 } })
    prismaMock.costBreakdown.aggregate.mockResolvedValueOnce({ _sum: { amount: 0 } })

    const stats = await getAdminDashboardStats()

    expect(stats.byStatus.REJEITADO).toBe(3)
    expect(stats.totalRequests).toBe(3)
  })

  it('budgetCommitted usa aggregate filtrado por despesas ativas', async () => {
    prismaMock.expenseRequest.count.mockResolvedValue(0)
    prismaMock.expenseRequest.groupBy.mockResolvedValue([])
    prismaMock.project.aggregate
      .mockResolvedValueOnce({ _sum: { budget: new Prisma.Decimal(50), usedBudget: new Prisma.Decimal(10) } })
    prismaMock.costBreakdown.aggregate.mockResolvedValueOnce({ _sum: { amount: new Prisma.Decimal(999) } })

    await getAdminDashboardStats()

    const committedCall = prismaMock.costBreakdown.aggregate.mock.calls[0][0]
    expect(committedCall.where).toEqual({
      expenseRequest: {
        status: ExpenseRequestStatus.EM_PROCESSAMENTO,
      },
    })
  })

  it('getTopProjects retorna até N projetos ordenados por uso', async () => {
    prismaMock.project.findMany.mockResolvedValue([
      {
        id: 'p1',
        name: 'Alpha',
        usedBudget: new Prisma.Decimal(900),
        _count: { costBreakdowns: 4 },
        costBreakdowns: [],
      },
      {
        id: 'p2',
        name: 'Beta',
        usedBudget: new Prisma.Decimal(800),
        _count: { costBreakdowns: 9 },
        costBreakdowns: [],
      },
    ])

    const top = await getTopProjects(2)

    expect(top).toHaveLength(2)
    expect(top[0].id).toBe('p1')
    expect(top[0].name).toBe('Alpha')
    expect(top[0].allocationsCount).toBe(4)
    expect(top[0].totalValue).toBe('900')
    expect(top[1].totalValue).toBe('800')
    expect(prismaMock.project.findMany).toHaveBeenCalled()
  })

  it('getTopProjects usa limite padrão quando omitido', async () => {
    prismaMock.project.findMany.mockResolvedValue([])

    await getTopProjects()

    expect(prismaMock.project.findMany).toHaveBeenCalled()
  })

  it('valores somados usam fallback 0 quando aggregate vem vazio', async () => {
    prismaMock.expenseRequest.count.mockResolvedValue(0)
    prismaMock.expenseRequest.groupBy.mockResolvedValue([])
    prismaMock.project.aggregate
      .mockResolvedValueOnce({ _sum: { budget: null, usedBudget: null } })
    prismaMock.costBreakdown.aggregate.mockResolvedValueOnce({ _sum: { amount: null } })

    const stats = await getAdminDashboardStats()

    expect(stats.totalValue).toBe(0)
    expect(stats.budgetCommitted.toNumber()).toBe(0)
  })
})
