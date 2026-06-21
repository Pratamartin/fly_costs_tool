import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CreateExpenseSchema } from '@/schemas/expense.schema'
import { ExpenseRequestStatus } from '@/generated/prisma/client'
import { UserRole } from '@/generated/prisma/enums'

vi.mock('@/lib/storage', () => ({
  isStorageConfigured: () => false,
  validatePDF: () => ({ valid: false, error: 'STORAGE_NOT_CONFIGURED' }),
  uploadFile: async () => ({ fileKey: '', fileName: '', fileSize: 0 }),
  deleteFile: async () => {},
  deleteObjects: async () => {},
  getSignedDownloadUrl: async () => '',
}))

const prismaMock = vi.hoisted(() => ({
  expenseRequest: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  preferenceSurveyAnswer: {
    deleteMany: vi.fn(),
    create: vi.fn(),
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

import * as preferenceSurveyService from '@/services/preference-survey.service'
import {
  createExpenseRequest,
  getAllExpenseRequests,
  getExpenseById,
  updateExpense,
  updateExpenseStatus,
} from '@/services/expense.service'

const STUDENT_ID = 'c341c8fa-724f-4ab2-9a4e-5ca55f201ad4'
const EXPENSE_ID = '123e4567-e89b-12d3-a456-426614174000'
const SAMPLE_PDF = readFileSync(join(__dirname, 'memorando', 'Memorando.pdf'))

function expenseRow(overrides: Record<string, unknown> = {}) {
  return {
    id: EXPENSE_ID,
    studentId: STUDENT_ID,
    title: ' Congresso ',
    description: null,
    status: ExpenseRequestStatus.PENDENTE,
    rejectionReason: null,
    correctionReason: null as string | null,
    attachmentKey: null as string | null,
    createdAt: new Date(),
    updatedAt: new Date(),
    student: { id: STUDENT_ID, name: 'Codibentinho' },
    costBreakdowns: [],
    surveyAnswers: [],
    ...overrides,
  }
}

describe('CreateExpenseSchema (validação campos / datas)', () => {
  const validBase = {
    title: 'Viagem à conferência',
    event: { name: 'Evento Teste', location: 'Local Teste' },
    article: { classification: 'A1' },
    surveyAnswers: [
      { expenseCategoryId: '123e4567-e89b-12d3-a456-426614174000', data: { some: 'data' } },
    ],
  }

  it('aceita criação com localização e datas válidas', () => {
    const r = CreateExpenseSchema.safeParse(validBase)
    if (!r.success) {
      console.log('Zod errors:', JSON.stringify(r.error.format(), null, 2))
    }
    expect(r.success).toBe(true)
  })

  it('falha sem campos obrigatórios (ex.: title)', () => {
    const { title: _t, ...rest } = validBase
    const r = CreateExpenseSchema.safeParse(rest)
    expect(r.success).toBe(false)
  })

  it('falha se surveyAnswers estiver vazio', () => {
    const r = CreateExpenseSchema.safeParse({
      ...validBase,
      surveyAnswers: [],
    })
    expect(r.success).toBe(false)
  })

  it('createExpenseRequest retorna erro quando validação de respostas falha', async () => {
    vi.mocked(preferenceSurveyService.validateAnswers).mockResolvedValueOnce({ error: 'VALIDATION_ERROR' })

    const result = await createExpenseRequest(STUDENT_ID, validBase)

    expect('error' in result && result.error).toBe('VALIDATION_ERROR')
    expect(prismaMock.expenseRequest.create).not.toHaveBeenCalled()
  })
})

describe('createExpenseRequest', () => {
  it('persiste despesa básica', async () => {
    prismaMock.expenseRequest.create.mockResolvedValue(expenseRow())
    prismaMock.expenseRequest.findUnique.mockResolvedValue(expenseRow())

    const result = await createExpenseRequest(STUDENT_ID, {
      title: 'Evento',
      surveyAnswers: [{ expenseCategoryId: 'cat-1', data: {} }],
    })

    expect('error' in result).toBe(false)
    if ('error' in result)
      return
    expect(result.title).toBe(' Congresso ')
    expect(prismaMock.expenseRequest.create).toHaveBeenCalled()
  })
})

describe('getAllExpenseRequests / getExpenseById (formato retorno)', () => {
  it('lista inclui attachmentKey quando presente', async () => {
    prismaMock.expenseRequest.findMany.mockResolvedValue([
      expenseRow({ attachmentKey: 'memorandos/k.pdf' }),
    ])

    const result = await getAllExpenseRequests(STUDENT_ID, UserRole.ALUNO, {})

    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result[0].attachmentKey).toBe('memorandos/k.pdf')
  })

  it('getExpenseById retorna rejectionReason e costBreakdowns no payload', async () => {
    prismaMock.expenseRequest.findUnique.mockResolvedValue(
      expenseRow({
        status: ExpenseRequestStatus.REJEITADO,
        rejectionReason: 'Doc inválido',
        costBreakdowns: [],
      }),
    )

    const result = await getExpenseById(EXPENSE_ID, STUDENT_ID, UserRole.ALUNO)

    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.rejectionReason).toBe('Doc inválido')
    expect(Array.isArray(result.costBreakdowns)).toBe(true)
  })
})

describe('updateExpenseStatus (rejeição / motivo / aprovação)', () => {
  beforeEach(() => {
    prismaMock.expenseRequest.update.mockReset()
    prismaMock.expenseRequest.findUnique.mockReset()
  })

  it('rejeição com motivo persiste rejectionReason', async () => {
    prismaMock.expenseRequest.findUnique.mockResolvedValue(expenseRow())
    prismaMock.expenseRequest.update.mockImplementation(async ({ data }: { data: { rejectionReason?: string | null } }) =>
      expenseRow({ status: ExpenseRequestStatus.REJEITADO, rejectionReason: data.rejectionReason ?? null }),
    )

    const result = await updateExpenseStatus(
      EXPENSE_ID,
      ExpenseRequestStatus.REJEITADO,
      UserRole.COORDENADOR,
      'Falta documentação',
    )

    expect('error' in result).toBe(false)
    if ('error' in result)
      return
    expect(result.status).toBe(ExpenseRequestStatus.REJEITADO)
    expect(result.rejectionReason).toBe('Falta documentação')
  })

  it('rejeição sem motivo retorna MISSING_REASON', async () => {
    prismaMock.expenseRequest.findUnique.mockResolvedValue(expenseRow())

    const result = await updateExpenseStatus(EXPENSE_ID, ExpenseRequestStatus.REJEITADO, UserRole.COORDENADOR, undefined)

    expect('error' in result && result.error).toBe('MISSING_REASON')
    expect(prismaMock.expenseRequest.update).not.toHaveBeenCalled()
  })

  it('aprovação ignora reason e zera rejectionReason', async () => {
    prismaMock.expenseRequest.findUnique.mockResolvedValue(
      expenseRow({ rejectionReason: 'algo antigo' }),
    )
    prismaMock.expenseRequest.update.mockImplementation(async () =>
      expenseRow({
        status: ExpenseRequestStatus.APROVADO,
        rejectionReason: null,
      }),
    )

    const result = await updateExpenseStatus(
      EXPENSE_ID,
      ExpenseRequestStatus.APROVADO,
      UserRole.COORDENADOR,
      'motivo que deve ser ignorado',
    )

    expect('error' in result).toBe(false)
    if ('error' in result)
      return
    expect(result.rejectionReason).toBeNull()
    expect(result.status).toBe(ExpenseRequestStatus.APROVADO)
  })

  it('resposta mantém rejectionReason após rejeitar', async () => {
    prismaMock.expenseRequest.findUnique.mockResolvedValue(expenseRow())
    prismaMock.expenseRequest.update.mockResolvedValue(
      expenseRow({
        status: ExpenseRequestStatus.REJEITADO,
        rejectionReason: 'Motivo X',
      }),
    )

    const result = await updateExpenseStatus(
      EXPENSE_ID,
      ExpenseRequestStatus.REJEITADO,
      UserRole.COORDENADOR,
      'Motivo X',
    )

    expect('error' in result).toBe(false)
    if ('error' in result)
      return
    expect(result.rejectionReason).toBe('Motivo X')
  })

  // ── T3.4.1 — transições com EM_EDICAO ──────────────────────────────────────

  it('T3.4.1 — transição PENDENTE → EM_EDICAO é inválida (não está nas transições permitidas)', async () => {
    prismaMock.expenseRequest.findUnique.mockResolvedValue(
      expenseRow({ status: ExpenseRequestStatus.PENDENTE }),
    )

    const result = await updateExpenseStatus(
      EXPENSE_ID,
      ExpenseRequestStatus.EM_EDICAO,
      UserRole.ADMIN,
      'motivo',
    )

    expect('error' in result && result.error).toBe('INVALID_TRANSITION')
    expect(prismaMock.expenseRequest.update).not.toHaveBeenCalled()
  })

  it('T3.4.1 — transição APROVADO → EM_EDICAO é válida quando role é ADMIN com motivo', async () => {
    prismaMock.expenseRequest.findUnique.mockResolvedValue(
      expenseRow({ status: ExpenseRequestStatus.APROVADO }),
    )
    prismaMock.expenseRequest.update.mockImplementation(async ({ data }: { data: { status: string, correctionReason?: string } }) =>
      expenseRow({ status: data.status, correctionReason: data.correctionReason ?? null }),
    )

    const result = await updateExpenseStatus(
      EXPENSE_ID,
      ExpenseRequestStatus.EM_EDICAO,
      UserRole.ADMIN,
      'Corrigir valor da passagem',
    )

    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.status).toBe(ExpenseRequestStatus.EM_EDICAO)
    expect((result as { correctionReason?: string | null }).correctionReason).toBe('Corrigir valor da passagem')
  })

  it('T3.4.1 — APROVADO → EM_EDICAO sem motivo retorna MISSING_REASON', async () => {
    prismaMock.expenseRequest.findUnique.mockResolvedValue(
      expenseRow({ status: ExpenseRequestStatus.APROVADO }),
    )

    const result = await updateExpenseStatus(
      EXPENSE_ID,
      ExpenseRequestStatus.EM_EDICAO,
      UserRole.ADMIN,
      undefined,
    )

    expect('error' in result && result.error).toBe('MISSING_REASON')
    expect(prismaMock.expenseRequest.update).not.toHaveBeenCalled()
  })

  it('T3.4.1 — somente ADMIN pode mover para EM_EDICAO (COORDENADOR recebe FORBIDDEN)', async () => {
    prismaMock.expenseRequest.findUnique.mockResolvedValue(
      expenseRow({ status: ExpenseRequestStatus.APROVADO }),
    )

    const result = await updateExpenseStatus(
      EXPENSE_ID,
      ExpenseRequestStatus.EM_EDICAO,
      UserRole.COORDENADOR,
      'motivo',
    )

    expect('error' in result && result.error).toBe('FORBIDDEN')
    expect(prismaMock.expenseRequest.update).not.toHaveBeenCalled()
  })
})

// ─── T3.4.1 — updateExpense (edição pelo aluno em EM_EDICAO) ─────────────────

describe('updateExpense — T3.4.1 (unit)', () => {
  beforeEach(() => {
    prismaMock.expenseRequest.update.mockReset()
    prismaMock.expenseRequest.findUnique.mockReset()
  })

  it('muda status para APROVADO e limpa correctionReason após edição do aluno', async () => {
    prismaMock.expenseRequest.findUnique.mockResolvedValue(
      expenseRow({
        status: ExpenseRequestStatus.EM_EDICAO,
        correctionReason: 'Corrigir valor',
        studentId: STUDENT_ID,
      }),
    )
    prismaMock.expenseRequest.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) =>
      expenseRow({
        ...data,
        status: ExpenseRequestStatus.APROVADO,
        correctionReason: null,
      }),
    )

    const result = await updateExpense(EXPENSE_ID, STUDENT_ID, { title: 'Congresso Atualizado' })

    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.status).toBe(ExpenseRequestStatus.APROVADO)
    expect((result as { correctionReason?: string | null }).correctionReason).toBeNull()
  })

  it('aluno sem ownership recebe FORBIDDEN', async () => {
    prismaMock.expenseRequest.findUnique.mockResolvedValue(
      expenseRow({
        status: ExpenseRequestStatus.EM_EDICAO,
        studentId: 'outro-aluno-id',
      }),
    )

    const result = await updateExpense(EXPENSE_ID, STUDENT_ID, { title: 'Tentativa' })

    expect('error' in result && result.error).toBe('FORBIDDEN')
    expect(prismaMock.expenseRequest.update).not.toHaveBeenCalled()
  })

  it('status diferente de EM_EDICAO retorna INVALID_EXPENSE_STATE', async () => {
    prismaMock.expenseRequest.findUnique.mockResolvedValue(
      expenseRow({ status: ExpenseRequestStatus.PENDENTE, studentId: STUDENT_ID }),
    )

    const result = await updateExpense(EXPENSE_ID, STUDENT_ID, { title: 'Tentativa' })

    expect('error' in result && result.error).toBe('INVALID_EXPENSE_STATE')
    expect(prismaMock.expenseRequest.update).not.toHaveBeenCalled()
  })

  it('despesa inexistente retorna EXPENSE_NOT_FOUND', async () => {
    prismaMock.expenseRequest.findUnique.mockResolvedValue(null)

    const result = await updateExpense('nao-existe', STUDENT_ID, { title: 'X' })

    expect('error' in result && result.error).toBe('EXPENSE_NOT_FOUND')
    expect(prismaMock.expenseRequest.update).not.toHaveBeenCalled()
  })
})
