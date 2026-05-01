import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as phrases from 'stoker/http-status-phrases'
import { EXPENSE_ERROR_CODES } from '@/constants/expense.constant'
import { CreateExpenseSchema } from '@/schemas/expense.schema'

const storageMock = vi.hoisted(() => ({
  isStorageConfigured: vi.fn(() => true),
  validatePDF: vi.fn(() => ({ valid: true })),
  uploadFile: vi.fn(async () => ({
    fileKey: 'memorandos/uuid-doc.pdf',
    fileName: 'doc.pdf',
    fileSize: 100,
  })),
  deleteFile: vi.fn(async () => {}),
  getSignedDownloadUrl: vi.fn(async () => 'https://signed.example/download'),
}))

vi.mock('@/lib/storage', () => storageMock)

import {
  attachMemorandumToExpense,
  createExpenseRequest,
  expenseInclude,
  getAllExpenseRequests,
  getExpenseById,
  getMemorandumDownloadUrl,
  updateExpenseStatus,
} from '@/services/expense.service'
import { ExpenseRequestStatus } from '@/generated/prisma/client'
import { UserRole } from '@/generated/prisma/enums'

const prismaMock = vi.hoisted(() => ({
  expenseRequest: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('@/lib/orm', () => ({
  default: prismaMock,
}))

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
      title: 'X',
      city: 'Manaus',
      state: 'BR-AM',
      country: 'BR',
      departureDate: new Date('2026-09-10'),
      returnDate: new Date('2026-09-01'),
    })
    expect('error' in result && result.error).toBe(EXPENSE_ERROR_CODES.RETURN_BEFORE_DEPARTURE)
    expect(prismaMock.expenseRequest.create).not.toHaveBeenCalled()
  })
})

describe('createExpenseRequest', () => {
  it('persiste despesa com localização e período', async () => {
    const row = expenseRow()
    prismaMock.expenseRequest.create.mockResolvedValue(row)

    const result = await createExpenseRequest(STUDENT_ID, {
      title: ' Congresso ',
      city: 'Manaus',
      state: 'BR-AM',
      country: 'BR',
      departureDate: new Date('2026-07-01T12:00:00.000Z'),
      returnDate: new Date('2026-07-05T12:00:00.000Z'),
    })

    expect('error' in result).toBe(false)
    if ('error' in result)
      return
    expect(result.city).toBe('Manaus')
    expect(result.state).toBe('BR-AM')
    expect(prismaMock.expenseRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          studentId: STUDENT_ID,
          title: ' Congresso ',
        }),
        include: expenseInclude,
      }),
    )
  })
})

describe('getAllExpenseRequests / getExpenseById (formato retorno)', () => {
  it('lista inclui campos de localização e attachmentKey quando presentes', async () => {
    const row = expenseRow({
      attachmentKey: 'memorandos/k.pdf',
      studentId: STUDENT_ID,
    })
    prismaMock.expenseRequest.findMany.mockResolvedValue([row])

    const result = await getAllExpenseRequests(STUDENT_ID, UserRole.ALUNO, {})

    expect(result).toHaveLength(1)
    expect(result[0]?.city).toBe('Manaus')
    expect(result[0]?.attachmentKey).toBe('memorandos/k.pdf')
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

    const result = await updateExpenseStatus(EXPENSE_ID, ExpenseRequestStatus.REJEITADO, undefined)

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
      'Motivo X',
    )

    expect('error' in result).toBe(false)
    if ('error' in result)
      return
    expect(result.rejectionReason).toBe('Motivo X')
  })
})

describe('attachMemorandumToExpense (upload memorando)', () => {
  it('upload memorando: grava attachmentKey e chama storage', async () => {
    prismaMock.expenseRequest.findUnique.mockResolvedValue(expenseRow())
    prismaMock.expenseRequest.update.mockResolvedValue(
      expenseRow({ attachmentKey: 'memorandos/uuid-doc.pdf' }),
    )

    const result = await attachMemorandumToExpense(EXPENSE_ID, STUDENT_ID, SAMPLE_PDF, 'Memorando.pdf')

    expect('error' in result).toBe(false)
    if ('error' in result)
      return
    expect(result.attachmentKey).toBe('memorandos/uuid-doc.pdf')
    expect(storageMock.validatePDF).toHaveBeenCalled()
    expect(storageMock.uploadFile).toHaveBeenCalled()
  })

  it('recusa quando storage não configurado', async () => {
    storageMock.isStorageConfigured.mockReturnValueOnce(false)

    const result = await attachMemorandumToExpense(
      EXPENSE_ID,
      STUDENT_ID,
      Buffer.from('%PDF'),
      'x.pdf',
    )

    expect('error' in result && result.error).toBe(EXPENSE_ERROR_CODES.STORAGE_NOT_CONFIGURED)
  })
})

describe('getMemorandumDownloadUrl', () => {
  it('retorna URL assinada para coordenador', async () => {
    prismaMock.expenseRequest.findUnique.mockResolvedValue({
      attachmentKey: 'memorandos/k.pdf',
      studentId: STUDENT_ID,
    })

    const result = await getMemorandumDownloadUrl(
      EXPENSE_ID,
      'coord-id',
      UserRole.COORDENADOR,
    )

    expect('error' in result).toBe(false)
    if ('error' in result)
      return
    expect(result.url).toContain('example')
    expect(storageMock.getSignedDownloadUrl).toHaveBeenCalledWith('memorandos/k.pdf', 3600)
  })
})
