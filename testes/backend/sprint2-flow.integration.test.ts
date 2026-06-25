/**
 * Fluxo Sprint 2 (#92): encadeamento dos serviços com Prisma mockado.
 * NOTA: Testes de memorando removidos (requerem backend/src/lib/storage.ts no CI).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma } from '@/generated/prisma/client'
import { ExpenseRequestStatus } from '@/generated/prisma/client'
import { UserRole } from '@/generated/prisma/enums'

vi.mock('@/lib/storage', () => ({
  isStorageConfigured: () => false,
  validatePDF: () => ({ valid: false, error: 'STORAGE_NOT_CONFIGURED' }),
  uploadFile: async () => ({ fileKey: '', fileName: '', fileSize: 0 }),
  deleteFile: async () => {},
  getSignedDownloadUrl: async () => '',
}))

vi.mock('@/services/budget.service', () => ({
  createCostBreakdown: vi.fn(),
  getProjectBudgetMetrics: vi.fn(),
}))

const prismaMock = vi.hoisted(() => ({
  expenseRequest: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  project: {
    findUnique: vi.fn(),
  },
  notification: {
    create: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn().mockResolvedValue([]),
  },
  $transaction: vi.fn((cb) => cb(prismaMock)),
}))

vi.mock('@/lib/orm', () => ({ default: prismaMock }))

vi.mock('@/services/preference-survey.service', () => ({
  validateAnswers: vi.fn().mockResolvedValue({ success: true }),
  createSurveyAnswer: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/services/notifications/staff.notification', () => ({
  notifyStaffOnStatusChange: vi.fn().mockResolvedValue(undefined),
}))

import { createCostBreakdown, getProjectBudgetMetrics } from '@/services/budget.service'
import {
  createExpenseRequest,
  getExpenseById,
  updateExpenseStatus,
  startExpenseProcessing,
} from '@/services/expense.service'

const txMock = {
  expenseRequest: { findUnique: vi.fn() },
  costBreakdown: { create: vi.fn() },
  project: { update: vi.fn() },
  notification: { create: vi.fn() },
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn().mockResolvedValue([]),
  },
}

const STUDENT_ID = 'c341c8fa-724f-4ab2-9a4e-5ca55f201ad4'
const EXPENSE_ID = '123e4567-e89b-12d3-a456-426614174000'
const PROJECT_ID = '223e4567-e89b-12d3-a456-426614174001'

function baseExpense(overrides: Record<string, unknown> = {}) {
  return {
    id: EXPENSE_ID,
    studentId: STUDENT_ID,
    title: 'Congresso',
    description: null,
    status: ExpenseRequestStatus.PENDENTE,
    rejectionReason: null,
    projectId: null,
    attachmentKey: null as string | null,
    createdAt: new Date(),
    updatedAt: new Date(),
    student: { id: STUDENT_ID, name: 'Aluno' },
    project: null,
    costBreakdowns: [],
    ...overrides,
  }
}

describe('Sprint 2 — fluxo geral (sem memorando para CI)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getProjectBudgetMetrics).mockResolvedValue({
      total: new Prisma.Decimal(50_000),
      used: new Prisma.Decimal(1000),
      available: new Prisma.Decimal(49_000),
      isActive: true,
    })
    vi.mocked(createCostBreakdown).mockResolvedValue({
      id: 'cb-flow',
      amount: new Prisma.Decimal(800),
      expenseCategory: { id: 'c1', name: 'Passagem', normalizedName: 'passagem' },
    })
  })

  it('cria solicitação → aprova → atribui projeto → discrimina → visualiza', async () => {
    prismaMock.expenseRequest.create.mockResolvedValue(baseExpense())
    prismaMock.expenseRequest.findUnique.mockResolvedValue(baseExpense())

    const created = await createExpenseRequest(STUDENT_ID, {
      title: 'Congresso',
      surveyAnswers: [{ expenseCategoryId: '123e4567-e89b-12d3-a456-426614174000', data: {} }],
    })
    expect('error' in created).toBe(false)

    prismaMock.expenseRequest.findUnique.mockResolvedValueOnce(baseExpense())
    prismaMock.expenseRequest.update.mockResolvedValueOnce(
      baseExpense({ status: ExpenseRequestStatus.APROVADO }),
    )
    const approved = await updateExpenseStatus(EXPENSE_ID, ExpenseRequestStatus.APROVADO, UserRole.COORDENADOR)
    expect('error' in approved).toBe(false)

    prismaMock.expenseRequest.findUnique.mockResolvedValueOnce(
      baseExpense({ status: ExpenseRequestStatus.APROVADO }),
    )
    prismaMock.expenseRequest.update.mockResolvedValueOnce(
      baseExpense({
        status: ExpenseRequestStatus.EM_PROCESSAMENTO,
      }),
    )
    const processing = await startExpenseProcessing(EXPENSE_ID)
    expect('error' in processing).toBe(false)

    const breakdown = await createCostBreakdown(EXPENSE_ID, {
      projectId: PROJECT_ID,
      subcategoryName: 'passagem',
      amount: 800,
    })
    expect('error' in breakdown).toBe(false)

    prismaMock.expenseRequest.findUnique.mockResolvedValueOnce(
      baseExpense({
        status: ExpenseRequestStatus.EM_PROCESSAMENTO,
        costBreakdowns: [
          {
            id: 'cb-flow',
            amount: new Prisma.Decimal(800),
            expenseCategory: {
              id: 'c1',
              name: 'Passagem',
              normalizedName: 'passagem',
            },
            project: { id: PROJECT_ID, name: 'Proj', code: 'P1' },
          },
        ],
      }),
    )

    const viewed = await getExpenseById(EXPENSE_ID, STUDENT_ID, UserRole.ALUNO)
    expect('error' in viewed).toBe(false)
    if ('error' in viewed) return
    expect(viewed.costBreakdowns[0].project?.id).toBe(PROJECT_ID)
    expect(viewed.costBreakdowns).toHaveLength(1)
  })
})
