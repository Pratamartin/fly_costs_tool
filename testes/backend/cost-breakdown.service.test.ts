import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as phrases from 'stoker/http-status-phrases'
import { PROJECT_ERROR_CODES } from '@/constants/project.constant'
import { Prisma } from '@/generated/prisma/client'

const prismaMock = vi.hoisted(() => ({
  $transaction: vi.fn(),
}))

vi.mock('@/lib/orm', () => ({ default: prismaMock }))

const budgetHelpers = vi.hoisted(() => ({
  isCategoryAllowedInProject: vi.fn(() => true),
  hasSufficientBudget: vi.fn(() => true),
}))

vi.mock('@/services/budget.service', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/services/budget.service')>()
  return {
    ...mod,
    isCategoryAllowedInProject: budgetHelpers.isCategoryAllowedInProject,
    hasSufficientBudget: budgetHelpers.hasSufficientBudget,
  }
})

import { createCostBreakdown } from '@/services/budget.service'

const txMock = {
  expenseRequest: {
    findUnique: vi.fn(),
  },
  costBreakdown: {
    create: vi.fn(),
  },
  project: {
    update: vi.fn(),
  },
}

function projectSnapshot(overrides: Record<string, unknown> = {}) {
  return {
    id: 'proj-flow',
    budget: new Prisma.Decimal(10_000),
    usedBudget: new Prisma.Decimal(2000),
    expenseCategories: [{ normalizedName: 'passagem' }, { normalizedName: 'inscricao' }],
    isActive: true,
    ...overrides,
  }
}

describe('createCostBreakdown (discriminação de custos)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation(async (cb: (tx: typeof txMock) => Promise<unknown>) => {
      const result = await cb(txMock)
      return result
    })
    budgetHelpers.isCategoryAllowedInProject.mockReturnValue(true)
    budgetHelpers.hasSufficientBudget.mockReturnValue(true)
  })

  it('persiste discriminação e incrementa usedBudget do projeto', async () => {
    txMock.expenseRequest.findUnique.mockResolvedValue({
      project: projectSnapshot(),
    })
    const created = {
      id: 'cb-1',
      amount: new Prisma.Decimal(500),
      expenseCategory: { normalizedName: 'passagem', name: 'Passagem', id: 'cat-1' },
    }
    txMock.costBreakdown.create.mockResolvedValue(created)
    txMock.project.update.mockResolvedValue({})

    const result = await createCostBreakdown('exp-1', {
      subcategoryName: 'passagem',
      amount: 500,
    })

    expect('error' in result).toBe(false)
    if ('error' in result)
      return
    expect(result).toEqual(created)
    expect(txMock.project.update).toHaveBeenCalledWith({
      where: { id: 'proj-flow' },
      data: { usedBudget: { increment: new Prisma.Decimal(500) } },
    })
  })

  it('aceita valor quando soma permanece dentro do budget disponível', async () => {
    txMock.expenseRequest.findUnique.mockResolvedValue({
      project: projectSnapshot({
        budget: new Prisma.Decimal(1000),
        usedBudget: new Prisma.Decimal(400),
      }),
    })
    txMock.costBreakdown.create.mockResolvedValue({ id: 'cb-2', amount: new Prisma.Decimal(600) })
    txMock.project.update.mockResolvedValue({})

    const result = await createCostBreakdown('exp-2', {
      subcategoryName: 'inscricao',
      amount: 600,
    })

    expect('error' in result).toBe(false)
  })

  it('subcategoria fora do projeto retorna erro de validação', async () => {
    budgetHelpers.isCategoryAllowedInProject.mockReturnValueOnce(false)
    txMock.expenseRequest.findUnique.mockResolvedValue({
      project: projectSnapshot(),
    })

    const result = await createCostBreakdown('exp-3', {
      subcategoryName: 'hotel_inexistente',
      amount: 50,
    })

    expect('error' in result && result.error).toBe(PROJECT_ERROR_CODES.INVALID_SUBCATEGORIES_COUNT)
    expect(txMock.costBreakdown.create).not.toHaveBeenCalled()
  })

  it('valor acima do disponível retorna INSUFFICIENT_FUNDS', async () => {
    budgetHelpers.hasSufficientBudget.mockReturnValueOnce(false)
    txMock.expenseRequest.findUnique.mockResolvedValue({
      project: projectSnapshot({
        budget: new Prisma.Decimal(1000),
        usedBudget: new Prisma.Decimal(950),
      }),
    })

    const result = await createCostBreakdown('exp-4', {
      subcategoryName: 'passagem',
      amount: 100,
    })

    expect('error' in result && result.error).toBe(PROJECT_ERROR_CODES.INSUFFICIENT_FUNDS)
  })

  it('projeto arquivado retorna PROJECT_ARCHIVED', async () => {
    txMock.expenseRequest.findUnique.mockResolvedValue({
      project: projectSnapshot({ isActive: false }),
    })

    const result = await createCostBreakdown('exp-5', {
      subcategoryName: 'passagem',
      amount: 10,
    })

    expect('error' in result && result.error).toBe(PROJECT_ERROR_CODES.PROJECT_ARCHIVED)
  })

  it('despesa sem projeto retorna NOT_FOUND', async () => {
    txMock.expenseRequest.findUnique.mockResolvedValue({
      project: null,
    })

    const result = await createCostBreakdown('exp-6', {
      subcategoryName: 'passagem',
      amount: 10,
    })

    expect('error' in result && result.error).toBe(phrases.NOT_FOUND)
  })
})
