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
  $transaction: vi.fn(),
}))

vi.mock('@/lib/orm', () => ({ default: prismaMock }))

import { createCostBreakdown } from '@/services/budget.service'
import {
  assignProjectToExpense,
  createExpenseRequest,
  getExpenseById,
  updateExpenseStatus,
} from '@/services/expense.service'

const txMock = {
  expenseRequest: { findUnique: vi.fn() },
  costBreakdown: { create: vi.fn() },
  project: { update: vi.fn() },
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
    city: 'Manaus',
    state: 'BR-AM',
    country: 'BR',
    departureDate: new Date('2026-07-01T12:00:00.000Z'),
    returnDate: new Date('2026-07-05T12:00:00.000Z'),
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
    prismaMock.$transaction.mockImplementation(async (cb: (tx: typeof txMock) => Promise<unknown>) => {
      const result = await cb(txMock)
      return result
    })
    prismaMock.project.findUnique.mockResolvedValue({
      budget: new Prisma.Decimal(50_000),
      usedBudget: new Prisma.Decimal(1000),
      isActive: true,
    })
  })

  it('cria solicitação → aprova → atribui projeto → discrimina → visualiza', async () => {
    prismaMock.expenseRequest.create.mockResolvedValue(baseExpense())

    const created = await createExpenseRequest(STUDENT_ID, {
      title: 'Congresso',
      city: 'Manaus',
      state: 'BR-AM',
      country: 'BR',
      departureDate: new Date('2026-07-01'),
      returnDate: new Date('2026-07-05'),
    })
    expect('error' in created).toBe(false)

    prismaMock.expenseRequest.findUnique.mockResolvedValueOnce(baseExpense())
    prismaMock.expenseRequest.update.mockResolvedValueOnce(
      baseExpense({ status: ExpenseRequestStatus.APROVADO }),
    )
    const approved = await updateExpenseStatus(EXPENSE_ID, ExpenseRequestStatus.APROVADO)
    expect('error' in approved).toBe(false)

    prismaMock.expenseRequest.findUnique.mockResolvedValueOnce(
      baseExpense({ status: ExpenseRequestStatus.APROVADO }),
    )
    prismaMock.expenseRequest.update.mockResolvedValueOnce(
      baseExpense({
        status: ExpenseRequestStatus.EM_PROCESSAMENTO,
        projectId: PROJECT_ID,
        project: { id: PROJECT_ID, name: 'Proj', code: 'P1' },
      }),
    )
    const assigned = await assignProjectToExpense(EXPENSE_ID, PROJECT_ID)
    expect('error' in assigned).toBe(false)

    txMock.expenseRequest.findUnique.mockResolvedValueOnce({
      project: {
        id: PROJECT_ID,
        budget: new Prisma.Decimal(50_000),
        usedBudget: new Prisma.Decimal(1000),
        expenseCategories: [{ normalizedName: 'passagem' }],
        isActive: true,
      },
    })
    txMock.costBreakdown.create.mockResolvedValue({
      id: 'cb-flow',
      amount: new Prisma.Decimal(800),
      expenseCategory: { id: 'c1', name: 'Passagem', normalizedName: 'passagem' },
    })
    txMock.project.update.mockResolvedValue({})

    const breakdown = await createCostBreakdown(EXPENSE_ID, {
      subcategoryName: 'passagem',
      amount: 800,
    })
    expect('error' in breakdown).toBe(false)

    prismaMock.expenseRequest.findFirst.mockResolvedValueOnce(
      baseExpense({
        status: ExpenseRequestStatus.EM_PROCESSAMENTO,
        projectId: PROJECT_ID,
        project: { id: PROJECT_ID, name: 'Proj', code: 'P1' },
        costBreakdowns: [
          {
            id: 'cb-flow',
            amount: new Prisma.Decimal(800),
            expenseCategory: {
              id: 'c1',
              name: 'Passagem',
              normalizedName: 'passagem',
            },
          },
        ],
      }),
    )

    const viewed = await getExpenseById(EXPENSE_ID, STUDENT_ID, UserRole.ALUNO)
    expect(viewed).not.toBeNull()
    expect(viewed!.project?.id).toBe(PROJECT_ID)
    expect(viewed!.costBreakdowns).toHaveLength(1)
  })
})
