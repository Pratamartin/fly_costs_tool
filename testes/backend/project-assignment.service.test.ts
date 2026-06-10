import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/storage', () => ({
  isStorageConfigured: vi.fn(() => false),
  validatePDF: vi.fn(),
  uploadFile: vi.fn(),
  deleteFile: vi.fn(),
  getSignedDownloadUrl: vi.fn(),
}))
import { assignProjectToExpense } from '@/services/expense.service'
import { Prisma } from '@/generated/prisma/client'
import { ExpenseRequestStatus as E } from '@/generated/prisma/enums'

const prismaMock = vi.hoisted(() => ({
  expenseRequest: {
    findUnique: vi.fn(),
    update: vi.fn(),
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

const budgetMock = vi.hoisted(() => ({
  getProjectBudgetMetrics: vi.fn(),
}))

vi.mock('@/services/budget.service', () => budgetMock)

const EXPENSE_ID = '123e4567-e89b-12d3-a456-426614174000'
const PROJECT_ID = '223e4567-e89b-12d3-a456-426614174001'

function metrics(available: number, isActive = true) {
  return {
    total: new Prisma.Decimal(10_000),
    used: new Prisma.Decimal(10_000 - available),
    available: new Prisma.Decimal(available),
    isActive,
  }
}

describe('assignProjectToExpense (atribuição de projeto)', () => {
  it('atribuição com status APROVADO avança para EM_PROCESSAMENTO', async () => {
    prismaMock.expenseRequest.findUnique.mockResolvedValue({
      id: EXPENSE_ID,
      status: E.APROVADO,
      projectId: null,
    })
    budgetMock.getProjectBudgetMetrics.mockResolvedValue(metrics(5000))
    prismaMock.expenseRequest.update.mockResolvedValue({
      id: EXPENSE_ID,
      status: E.EM_PROCESSAMENTO,
      projectId: PROJECT_ID,
    })

    const result = await assignProjectToExpense(EXPENSE_ID, PROJECT_ID)

    expect('error' in result).toBe(false)
    if ('error' in result)
      return
    expect(result.status).toBe(E.EM_PROCESSAMENTO)
    expect(result.projectId).toBe(PROJECT_ID)
  })

  it('não-APROVADO retorna INVALID_EXPENSE_STATE', async () => {
    prismaMock.expenseRequest.findUnique.mockResolvedValue({
      id: EXPENSE_ID,
      status: E.PENDENTE,
    })

    const result = await assignProjectToExpense(EXPENSE_ID, PROJECT_ID)

    expect('error' in result && result.error).toBe('INVALID_EXPENSE_STATE')
  })

  it('validação de budget: saldo 0 retorna PROJECT_INSUFFICIENT_FUNDS', async () => {
    prismaMock.expenseRequest.findUnique.mockResolvedValue({
      id: EXPENSE_ID,
      status: E.APROVADO,
    })
    budgetMock.getProjectBudgetMetrics.mockResolvedValue(metrics(0))

    const result = await assignProjectToExpense(EXPENSE_ID, PROJECT_ID)

    expect('error' in result && result.error).toBe('PROJECT_INSUFFICIENT_FUNDS')
  })

  it('projeto arquivado retorna PROJECT_ARCHIVED', async () => {
    prismaMock.expenseRequest.findUnique.mockResolvedValue({
      id: EXPENSE_ID,
      status: E.APROVADO,
    })
    budgetMock.getProjectBudgetMetrics.mockResolvedValue({
      ...metrics(1000),
      isActive: false,
    })

    const result = await assignProjectToExpense(EXPENSE_ID, PROJECT_ID)

    expect('error' in result && result.error).toBe('PROJECT_ARCHIVED')
  })
})
