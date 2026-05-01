import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as phrases from 'stoker/http-status-phrases'
import { PROJECT_ERROR_CODES } from '@/constants/project.constant'
import { Prisma } from '@/generated/prisma/client'

const createCostBreakdownMock = vi.fn()

vi.mock('@/services/budget.service', () => ({
  createCostBreakdown: createCostBreakdownMock,
}))

describe('createCostBreakdown (discriminação de custos - mockado)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('persiste discriminação e retorna objeto criado', async () => {
    const created = {
      id: 'cb-1',
      amount: new Prisma.Decimal(500),
      expenseCategory: { normalizedName: 'passagem', name: 'Passagem', id: 'cat-1' },
    }
    createCostBreakdownMock.mockResolvedValue(created)

    const result = await createCostBreakdownMock('exp-1', {
      subcategoryName: 'passagem',
      amount: 500,
    })

    expect('error' in result).toBe(false)
    expect(result).toEqual(created)
  })

  it('aceita valor dentro do budget', async () => {
    createCostBreakdownMock.mockResolvedValue({ id: 'cb-2', amount: new Prisma.Decimal(600) })

    const result = await createCostBreakdownMock('exp-2', {
      subcategoryName: 'inscricao',
      amount: 600,
    })

    expect('error' in result).toBe(false)
  })

  it('subcategoria fora do projeto retorna erro', async () => {
    createCostBreakdownMock.mockResolvedValue({ error: PROJECT_ERROR_CODES.INVALID_SUBCATEGORIES_COUNT })

    const result = await createCostBreakdownMock('exp-3', {
      subcategoryName: 'hotel_inexistente',
      amount: 50,
    })

    expect('error' in result && result.error).toBe(PROJECT_ERROR_CODES.INVALID_SUBCATEGORIES_COUNT)
  })

  it('valor acima do disponível retorna INSUFFICIENT_FUNDS', async () => {
    createCostBreakdownMock.mockResolvedValue({ error: PROJECT_ERROR_CODES.INSUFFICIENT_FUNDS })

    const result = await createCostBreakdownMock('exp-4', {
      subcategoryName: 'passagem',
      amount: 100,
    })

    expect('error' in result && result.error).toBe(PROJECT_ERROR_CODES.INSUFFICIENT_FUNDS)
  })

  it('projeto arquivado retorna PROJECT_ARCHIVED', async () => {
    createCostBreakdownMock.mockResolvedValue({ error: PROJECT_ERROR_CODES.PROJECT_ARCHIVED })

    const result = await createCostBreakdownMock('exp-5', {
      subcategoryName: 'passagem',
      amount: 10,
    })

    expect('error' in result && result.error).toBe(PROJECT_ERROR_CODES.PROJECT_ARCHIVED)
  })

  it('despesa sem projeto retorna NOT_FOUND', async () => {
    createCostBreakdownMock.mockResolvedValue({ error: phrases.NOT_FOUND })

    const result = await createCostBreakdownMock('exp-6', {
      subcategoryName: 'passagem',
      amount: 10,
    })

    expect('error' in result && result.error).toBe(phrases.NOT_FOUND)
  })
})
