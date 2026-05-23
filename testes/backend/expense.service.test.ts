import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as phrases from 'stoker/http-status-phrases'
import { EXPENSE_ERROR_CODES } from '@/constants/expense.constant'
import { CreateExpenseSchema } from '@/schemas/expense.schema'
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
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  notification: {
    create: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
}))

vi.mock('@/lib/orm', () => ({ default: prismaMock }))

import {
  createExpenseRequest,
  expenseInclude,
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
    city: 'Manaus',
    state: 'BR-AM',
    country: 'BR',
    departureDate: new Date('2026-07-01T12:00:00.000Z'),
    returnDate: new Date('2026-07-05T12:00:00.000Z'),
    status: ExpenseRequestStatus.PENDENTE,
    rejectionReason: null,
    correctionReason: null as string | null,
    projectId: null,
    attachmentKey: null as string | null,
    createdAt: new Date(),
    updatedAt: new Date(),
    student: { id: STUDENT_ID, name: 'Codibentinho' },
    project: null,
    costBreakdowns: [],
    ...overrides,
  }
}

describe('CreateExpenseSchema (validação campos / datas)', () => {
  const validBase = {
    title: 'Viagem à conferência',
    city: 'Manaus',
    state: 'BR-AM',
    country: 'BR',
    departureDate: new Date('2026-08-01'),
    returnDate: new Date('2026-08-10'),
  }

  it('aceita criação com localização e datas válidas', () => {
    const r = CreateExpenseSchema.safeParse(validBase)
    expect(r.success).toBe(true)
  })

  it('falha sem campos obrigatórios (ex.: city)', () => {
    const { city: _c, ...rest } = validBase
    const r = CreateExpenseSchema.safeParse(rest)
    expect(r.success).toBe(false)
  })

  it('falha quando volta < ida (schema)', () => {
    const r = CreateExpenseSchema.safeParse({
      ...validBase,
      departureDate: new Date('2026-08-10'),
      returnDate: new Date('2026-08-01'),
    })
    expect(r.success).toBe(false)
  })

  it('createExpenseRequest retorna erro quando volta < ida (serviço, antes do Prisma)', async () => {
    const result = await createExpenseRequest(STUDENT_ID, {
      title: 'T',
      city: 'Manaus',
      state: 'BR-AM',
      country: 'BR',
      departureDate: new Date('2026-08-10'),
      returnDate: new Date('2026-08-01'),
    })

    expect('error' in result && result.error).toBe(EXPENSE_ERROR_CODES.RETURN_BEFORE_DEPARTURE)
    expect(prismaMock.expenseRequest.create).not.toHaveBeenCalled()
  })
})

describe('createExpenseRequest', () => {
  it('persiste despesa com localização e período', async () => {
    prismaMock.expenseRequest.create.mockResolvedValue(expenseRow())

    const result = await createExpenseRequest(STUDENT_ID, {
      title: 'Evento',
      city: 'Manaus',
      state: 'BR-AM',
      country: 'BR',
      departureDate: new Date('2026-07-01'),
      returnDate: new Date('2026-07-05'),
    })

    expect('error' in result).toBe(false)
    if ('error' in result)
      return
    expect(result.city).toBe('Manaus')
    expect(prismaMock.expenseRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({ include: expenseInclude }),
    )
  })
})

describe('getAllExpenseRequests / getExpenseById (formato retorno)', () => {
  it('lista inclui campos de localização e attachmentKey quando presentes', async () => {
    prismaMock.expenseRequest.findMany.mockResolvedValue([
      expenseRow({ city: 'São Paulo', attachmentKey: 'memorandos/k.pdf' }),
    ])

    const list = await getAllExpenseRequests(STUDENT_ID, UserRole.ALUNO, {})

    expect(list[0].city).toBe('São Paulo')
    expect(list[0].attachmentKey).toBe('memorandos/k.pdf')
  })

  it('getExpenseById retorna rejectionReason e costBreakdowns no payload', async () => {
    prismaMock.expenseRequest.findFirst.mockResolvedValue(
      expenseRow({
        status: ExpenseRequestStatus.REJEITADO,
        rejectionReason: 'Doc inválido',
        costBreakdowns: [],
      }),
    )

    const result = await getExpenseById(EXPENSE_ID, STUDENT_ID, UserRole.ALUNO)

    expect(result?.rejectionReason).toBe('Doc inválido')
    expect(Array.isArray(result?.costBreakdowns)).toBe(true)
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

  it('rejeição sem motivo retorna REASON_REQUIRED', async () => {
    prismaMock.expenseRequest.findUnique.mockResolvedValue(expenseRow())

    const result = await updateExpenseStatus(EXPENSE_ID, ExpenseRequestStatus.REJEITADO, UserRole.COORDENADOR, undefined)

    expect('error' in result && result.error).toBe(EXPENSE_ERROR_CODES.REASON_REQUIRED)
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

    expect('error' in result && result.error).toBeDefined()
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

  it('T3.4.1 — APROVADO → EM_EDICAO sem motivo retorna REASON_REQUIRED', async () => {
    prismaMock.expenseRequest.findUnique.mockResolvedValue(
      expenseRow({ status: ExpenseRequestStatus.APROVADO }),
    )

    const result = await updateExpenseStatus(
      EXPENSE_ID,
      ExpenseRequestStatus.EM_EDICAO,
      UserRole.ADMIN,
      undefined,
    )

    expect('error' in result && result.error).toBe(EXPENSE_ERROR_CODES.REASON_REQUIRED)
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

    expect('error' in result).toBe(true)
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

    expect('error' in result).toBe(true)
    expect(prismaMock.expenseRequest.update).not.toHaveBeenCalled()
  })

  it('status diferente de EM_EDICAO retorna CONFLICT', async () => {
    prismaMock.expenseRequest.findUnique.mockResolvedValue(
      expenseRow({ status: ExpenseRequestStatus.PENDENTE, studentId: STUDENT_ID }),
    )

    const result = await updateExpense(EXPENSE_ID, STUDENT_ID, { title: 'Tentativa' })

    expect('error' in result).toBe(true)
    expect(prismaMock.expenseRequest.update).not.toHaveBeenCalled()
  })

  it('despesa inexistente retorna NOT_FOUND', async () => {
    prismaMock.expenseRequest.findUnique.mockResolvedValue(null)

    const result = await updateExpense('nao-existe', STUDENT_ID, { title: 'X' })

    expect('error' in result).toBe(true)
    expect(prismaMock.expenseRequest.update).not.toHaveBeenCalled()
  })
})
