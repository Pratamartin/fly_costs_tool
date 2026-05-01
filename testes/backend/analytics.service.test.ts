import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ExpenseRequestStatus } from '@/generated/prisma/enums'
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
        _sum: { budget: 100_000, usedBudget: 35_000 },
      })
      .mockResolvedValueOnce({
        _sum: { usedBudget: 12_500 },
      })

    const stats = await getAdminDashboardStats()

    expect(stats.totalRequests).toBe(42)
    expect(stats.byStatus.PENDENTE).toBe(20)
    expect(stats.byStatus.APROVADO).toBe(15)
    expect(stats.byStatus.EM_PROCESSAMENTO).toBe(7)
    expect(stats.totalValue).toBe(100_000)
    expect(stats.budgetCommitted).toBe(12_500)
    expect(prismaMock.project.aggregate).toHaveBeenCalledTimes(2)
  })

  it('groupBy alimenta todas as chaves de status presentes no resultado', async () => {
    prismaMock.expenseRequest.count.mockResolvedValue(3)
    prismaMock.expenseRequest.groupBy.mockResolvedValue([
      { status: ExpenseRequestStatus.REJEITADO, _count: { id: 3 } },
    ])
    prismaMock.project.aggregate
      .mockResolvedValueOnce({ _sum: { budget: 0, usedBudget: 0 } })
      .mockResolvedValueOnce({ _sum: { usedBudget: 0 } })

    const stats = await getAdminDashboardStats()

    expect(stats.byStatus.REJEITADO).toBe(3)
    expect(stats.totalRequests).toBe(3)
  })

  it('budgetCommitted usa aggregate filtrado por despesas ativas', async () => {
    prismaMock.expenseRequest.count.mockResolvedValue(0)
    prismaMock.expenseRequest.groupBy.mockResolvedValue([])
    prismaMock.project.aggregate
      .mockResolvedValueOnce({ _sum: { budget: 50, usedBudget: 10 } })
      .mockResolvedValueOnce({ _sum: { usedBudget: 999 } })

    await getAdminDashboardStats()

    const committedCall = prismaMock.project.aggregate.mock.calls[1][0]
    expect(committedCall.where).toEqual({
      expenseRequests: {
        some: {
          status: {
            in: [ExpenseRequestStatus.APROVADO, ExpenseRequestStatus.EM_PROCESSAMENTO],
          },
        },
      },
    })
  })

  it('getTopProjects retorna até N projetos ordenados por uso', async () => {
    prismaMock.project.findMany.mockResolvedValue([
      {
        id: 'p1',
        name: 'Alpha',
        usedBudget: 900,
        _count: { expenseRequests: 4 },
      },
      {
        id: 'p2',
        name: 'Beta',
        usedBudget: 800,
        _count: { expenseRequests: 9 },
      },
    ])

    const top = await getTopProjects(2)

    expect(top).toHaveLength(2)
    expect(top[0]).toEqual({
      id: 'p1',
      name: 'Alpha',
      totalRequests: 4,
      totalValue: 900,
    })
    expect(top[1].totalValue).toBe(800)
    expect(prismaMock.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 2,
        orderBy: [{ usedBudget: 'desc' }, { expenseRequests: { _count: 'desc' } }],
      }),
    )
  })

  it('getTopProjects usa limite padrão quando omitido', async () => {
    prismaMock.project.findMany.mockResolvedValue([])

    await getTopProjects()

    expect(prismaMock.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 }),
    )
  })

  it('valores somados usam fallback 0 quando aggregate vem vazio', async () => {
    prismaMock.expenseRequest.count.mockResolvedValue(0)
    prismaMock.expenseRequest.groupBy.mockResolvedValue([])
    prismaMock.project.aggregate
      .mockResolvedValueOnce({ _sum: { budget: null, usedBudget: null } })
      .mockResolvedValueOnce({ _sum: { usedBudget: null } })

    const stats = await getAdminDashboardStats()

    expect(stats.totalValue).toBe(0)
    expect(stats.budgetCommitted).toBe(0)
  })
})
