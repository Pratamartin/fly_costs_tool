/**
 * T3.3.2 — attachment.service.test.ts
 * arquivo muito grande lança erro | tipo não permitido lança erro |
 * key gerada inclui expenseId
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ExpenseRequestStatus } from '@/generated/prisma/client'
import { UserRole } from '@/generated/prisma/enums'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const storageMock = vi.hoisted(() => ({
  isStorageConfigured: vi.fn(() => true),
  validatePDF: vi.fn(async () => ({ valid: true })),
  uploadFile: vi.fn(async (opts: { file: File, folder: string, subfolder?: string, prefix?: string }) => {
    const path = opts.subfolder ? `${opts.folder}/${opts.subfolder}` : opts.folder
    const prefix = opts.prefix ? `${opts.prefix}_` : ''
    return {
      fileKey: `${path}/${prefix}uuid-${opts.file.name}`,
      fileName: opts.file.name,
      fileSize: opts.file.size,
    }
  }),
  deleteFile: vi.fn(async () => {}),
  getSignedDownloadUrl: vi.fn(async () => 'https://signed.example.com/url'),
}))

vi.mock('@/lib/storage', () => storageMock)

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

const prismaMock = vi.hoisted(() => ({
  expenseRequest: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  costBreakdown: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('@/lib/orm', () => ({ default: prismaMock }))

vi.mock('@/env', () => ({
  default: {
    R2_ACCESS_KEY_ID: 'test-key',
    R2_SECRET_ACCESS_KEY: 'test-secret',
    R2_ENDPOINT: 'https://r2.cloudflarestorage.com',
    R2_BUCKET_NAME: 'test-bucket',
  },
}))

import { attachMemorandumToExpense } from '@/services/expense.service'
import { uploadCostBreakdownReceipt } from '@/services/budget.service'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EXPENSE_ID = 'expense-uuid-001'
const STUDENT_ID = 'student-uuid-001'
const BREAKDOWN_ID = 'breakdown-uuid-001'

function expenseRow(overrides: Record<string, unknown> = {}) {
  return {
    id: EXPENSE_ID,
    studentId: STUDENT_ID,
    status: ExpenseRequestStatus.PENDENTE,
    attachmentKey: null as string | null,
    title: 'Congresso',
    description: null,
    city: 'Manaus',
    state: 'BR-AM',
    country: 'BR',
    departureDate: new Date('2026-07-01'),
    returnDate: new Date('2026-07-05'),
    rejectionReason: null,
    correctionReason: null,
    projectId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    student: { id: STUDENT_ID, name: 'Aluno' },
    project: null,
    costBreakdowns: [],
    ...overrides,
  }
}

function makeFile(sizeBytes: number, name = 'doc.pdf', isPDF = true): File {
  const buf = new Uint8Array(sizeBytes)
  if (isPDF) {
    buf[0] = 0x25 // %
    buf[1] = 0x50 // P
    buf[2] = 0x44 // D
    buf[3] = 0x46 // F
  }
  return new File([buf], name, { type: isPDF ? 'application/pdf' : 'image/jpeg' })
}

// ─── T3.3.2 — attachMemorandumToExpense: validação de arquivo ─────────────────

describe('attachMemorandumToExpense — T3.3.2 (unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storageMock.isStorageConfigured.mockReturnValue(true)
    storageMock.validatePDF.mockResolvedValue({ valid: true })
    prismaMock.expenseRequest.update.mockImplementation(async () => expenseRow({ attachmentKey: 'memorandos/uuid-doc.pdf' }))
  })

  it('arquivo muito grande (>5 MB) retorna erro de tamanho', async () => {
    const bigFile = makeFile(6 * 1024 * 1024 + 1, 'grande.pdf')
    prismaMock.expenseRequest.findUnique.mockResolvedValue(expenseRow())
    storageMock.validatePDF.mockResolvedValue({ valid: false, error: 'File size exceeds limit' })

    const result = await attachMemorandumToExpense(EXPENSE_ID, STUDENT_ID, bigFile)

    expect('error' in result && result.error).toBe('FILE_TOO_LARGE')
    expect(storageMock.uploadFile).not.toHaveBeenCalled()
  })

  it('tipo não permitido (não-PDF) retorna erro de validação', async () => {
    const imageFile = makeFile(512, 'foto.jpg', false)
    prismaMock.expenseRequest.findUnique.mockResolvedValue(expenseRow())
    storageMock.validatePDF.mockResolvedValue({ valid: false, error: 'Invalid type' })

    const result = await attachMemorandumToExpense(EXPENSE_ID, STUDENT_ID, imageFile)

    expect('error' in result && result.error).toBe('UNSUPPORTED_MEDIA_TYPE')
    expect(storageMock.uploadFile).not.toHaveBeenCalled()
  })

  it('storage não configurado retorna STORAGE_UNAVAILABLE', async () => {
    storageMock.isStorageConfigured.mockReturnValue(false)
    const file = makeFile(512)

    const result = await attachMemorandumToExpense(EXPENSE_ID, STUDENT_ID, file)

    expect('error' in result && result.error).toBe('STORAGE_UNAVAILABLE')
    expect(storageMock.uploadFile).not.toHaveBeenCalled()
  })

  it('aluno sem ownership retorna FORBIDDEN', async () => {
    prismaMock.expenseRequest.findUnique.mockResolvedValue(expenseRow({ studentId: 'outro-aluno-id' }))
    const file = makeFile(512)

    const result = await attachMemorandumToExpense(EXPENSE_ID, STUDENT_ID, file)

    expect('error' in result && result.error).toBe('FORBIDDEN')
    expect(storageMock.uploadFile).not.toHaveBeenCalled()
  })

  it('PDF válido faz upload com sucesso', async () => {
    prismaMock.expenseRequest.findUnique.mockResolvedValue(expenseRow())
    storageMock.validatePDF.mockResolvedValue({ valid: true })
    storageMock.uploadFile.mockResolvedValue({
      fileKey: 'memorandos/uuid-doc.pdf',
      fileName: 'doc.pdf',
      fileSize: 512,
    })

    const file = makeFile(512)
    const result = await attachMemorandumToExpense(EXPENSE_ID, STUDENT_ID, file)

    expect('error' in result).toBe(false)
    expect(storageMock.uploadFile).toHaveBeenCalledOnce()
  })
})

// ─── T3.3.2 — uploadCostBreakdownReceipt: key inclui expenseId ────────────────

describe('uploadCostBreakdownReceipt — T3.3.2 (unit)', () => {
  const CATEGORY_NAME = 'passagem'

  beforeEach(() => {
    vi.clearAllMocks()
    storageMock.isStorageConfigured.mockReturnValue(true)
    prismaMock.costBreakdown.findUnique.mockResolvedValue({
      id: BREAKDOWN_ID,
      expenseRequestId: EXPENSE_ID,
      attachmentKey: null,
      expenseCategory: { normalizedName: CATEGORY_NAME, name: 'Passagem', id: 'cat-1' },
    })
    prismaMock.costBreakdown.update.mockImplementation(async () => ({
      id: BREAKDOWN_ID,
      attachmentKey: `comprovantes/${EXPENSE_ID}/${CATEGORY_NAME}_uuid-file.jpg`,
      expenseCategory: { normalizedName: CATEGORY_NAME, name: 'Passagem', id: 'cat-1' },
    }))
  })

  it('key gerada inclui expenseId como subfolder', async () => {
    const file = new File([new Uint8Array(256)], 'recibo.jpg', { type: 'image/jpeg' })

    storageMock.uploadFile.mockImplementation(async (opts: { file: File, folder: string, subfolder?: string, prefix?: string }) => {
      const path = opts.subfolder ? `${opts.folder}/${opts.subfolder}` : opts.folder
      const prefix = opts.prefix ? `${opts.prefix}_` : ''
      return {
        fileKey: `${path}/${prefix}uuid-recibo.jpg`,
        fileName: 'recibo.jpg',
        fileSize: 256,
      }
    })

    await uploadCostBreakdownReceipt(EXPENSE_ID, BREAKDOWN_ID, file)

    expect(storageMock.uploadFile).toHaveBeenCalledOnce()
    const call = storageMock.uploadFile.mock.calls[0][0] as {
      folder: string
      subfolder: string
      prefix: string
    }
    expect(call.subfolder).toBe(EXPENSE_ID)
    expect(call.folder).toBe('comprovantes')
    expect(call.prefix).toBe(BREAKDOWN_ID)
  })

  it('storage não configurado retorna STORAGE_UNAVAILABLE', async () => {
    storageMock.isStorageConfigured.mockReturnValue(false)
    const file = new File([new Uint8Array(256)], 'r.jpg', { type: 'image/jpeg' })

    const result = await uploadCostBreakdownReceipt(EXPENSE_ID, BREAKDOWN_ID, file)

    expect('error' in result && result.error).toBe('STORAGE_UNAVAILABLE')
    expect(storageMock.uploadFile).not.toHaveBeenCalled()
  })

  it('breakdown inexistente retorna COST_BREAKDOWN_NOT_FOUND', async () => {
    prismaMock.costBreakdown.findUnique.mockResolvedValueOnce(null)
    const file = new File([new Uint8Array(256)], 'r.jpg', { type: 'image/jpeg' })

    const result = await uploadCostBreakdownReceipt(EXPENSE_ID, 'nao-existe', file)

    expect('error' in result && result.error).toBe('COST_BREAKDOWN_NOT_FOUND')
    expect(storageMock.uploadFile).not.toHaveBeenCalled()
  })
})
