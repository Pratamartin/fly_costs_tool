import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/storage', () => ({
  isStorageConfigured: vi.fn(() => false),
  validatePDF: vi.fn(),
  uploadFile: vi.fn(),
  deleteFile: vi.fn(),
  getSignedDownloadUrl: vi.fn(),
}))
import { createCostBreakdown } from '@/services/budget.service'
import { Prisma } from '@/generated/prisma/client'
import { ExpenseRequestStatus as E } from '@/generated/prisma/enums'

const prismaMock = vi.hoisted(() => ({
  $transaction: vi.fn(async (arg) => {
    if (Array.isArray(arg)) {
      return Promise.all(arg)
    }
    return arg(prismaMock)
  }),
  expenseRequest: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  project: {
    findUnique: vi.fn(),
  },
  costBreakdown: {
    aggregate: vi.fn(),
    create: vi.fn(),
  },
  notification: {
    create: vi.fn(),
  },
}))

vi.mock('@/lib/orm', () => ({ default: prismaMock }))

vi.mock('@/services/preference-survey.service', () => ({
  validateAnswers: vi.fn().mockResolvedValue({ success: true }),
  createSurveyAnswer: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/services/notifications', () => ({
  notifyStatusChange: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/services/notifications/staff.notification', () => ({
  notifyStaffOnStatusChange: vi.fn().mockResolvedValue(undefined),
}))



const EXPENSE_ID = '123e4567-e89b-12d3-a456-426614174000'
const PROJECT_ID = '223e4567-e89b-12d3-a456-426614174001'

function metrics(available: number, isActive = true) {
  return {
    budget: new Prisma.Decimal(10_000),
    usedBudget: new Prisma.Decimal(10_000 - available),
    available: new Prisma.Decimal(available),
    isActive,
    expenseCategories: [{ normalizedName: 'passagem' }],
    startDate: new Date('2000-01-01'),
    endDate: new Date('2100-01-01'),
  }
}

describe('createCostBreakdown (atribuição de projeto)', () => {
  it('atribuição com status EM_PROCESSAMENTO salva com sucesso', async () => {
    prismaMock.expenseRequest.findUnique.mockResolvedValue({
      id: EXPENSE_ID,
      status: E.EM_PROCESSAMENTO,
    })
    prismaMock.project.findUnique.mockResolvedValue(metrics(5000))
    prismaMock.costBreakdown.aggregate.mockResolvedValue({ _sum: { amount: 0 } })
    prismaMock.costBreakdown.create.mockResolvedValue({
      id: 'cb-1',
      projectId: PROJECT_ID,
    })

    const result = await createCostBreakdown(EXPENSE_ID, {
      projectId: PROJECT_ID,
      amount: 1000,
      subcategoryName: 'passagem',
    })

    expect('error' in result).toBe(false)
    if ('error' in result)
      return
    expect(result.projectId).toBe(PROJECT_ID)
  })

  it('não-APROVADO retorna INVALID_EXPENSE_STATE', async () => {
    prismaMock.expenseRequest.findUnique.mockResolvedValue({
      id: EXPENSE_ID,
      status: E.PENDENTE,
    })

    prismaMock.project.findUnique.mockResolvedValue(metrics(5000))
    prismaMock.costBreakdown.aggregate.mockResolvedValue({ _sum: { amount: 0 } })

    const result = await createCostBreakdown(EXPENSE_ID, {
      projectId: PROJECT_ID,
      amount: 1000,
      subcategoryName: 'passagem',
    })

    expect('error' in result && result.error).toBe('INVALID_EXPENSE_STATE')
  })

  it('validação de budget: saldo 0 retorna PROJECT_INSUFFICIENT_FUNDS', async () => {
    prismaMock.expenseRequest.findUnique.mockResolvedValue({
      id: EXPENSE_ID,
      status: E.EM_PROCESSAMENTO,
    })
    prismaMock.project.findUnique.mockResolvedValue(metrics(0))
    prismaMock.costBreakdown.aggregate.mockResolvedValue({ _sum: { amount: 0 } })

    const result = await createCostBreakdown(EXPENSE_ID, {
      projectId: PROJECT_ID,
      amount: 1000,
      subcategoryName: 'passagem',
    })

    expect('error' in result && result.error).toBe('PROJECT_INSUFFICIENT_FUNDS')
  })

  it('projeto arquivado retorna PROJECT_ARCHIVED', async () => {
    prismaMock.expenseRequest.findUnique.mockResolvedValue({
      id: EXPENSE_ID,
      status: E.EM_PROCESSAMENTO,
    })
    prismaMock.project.findUnique.mockResolvedValue(metrics(5000, false))
    prismaMock.costBreakdown.aggregate.mockResolvedValue({ _sum: { amount: 0 } })

    const result = await createCostBreakdown(EXPENSE_ID, {
      projectId: PROJECT_ID,
      amount: 1000,
      subcategoryName: 'passagem',
    })

    expect('error' in result && result.error).toBe('PROJECT_ARCHIVED')
  })
})
