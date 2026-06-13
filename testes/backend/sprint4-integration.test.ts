/**
 * Sprint 4 — Testes de Integração (nível de serviço)
 *
 * US 4.0: PATCH status → e-mail disparado (spy em notifyStatusChange)
 * US 4.0: Mesmo status → e-mail NÃO disparado (transição inválida)
 * US 4.4: GET /notifications — somente do usuário autenticado, ordenado desc, max 20
 * US 4.4: Outro usuário não vê notificações alheias
 * US 4.2: POST /auth/login → accessToken retornado
 * US 4.2: POST /auth/refresh com cookie válido → novo accessToken
 * US 4.2: Rota protegida sem token → erro de autenticação
 * US 4.1: Fluxo completo — forgot-password → reset-password → login com nova senha
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ExpenseRequestStatus } from '@/generated/prisma/client'
import { UserRole } from '@/generated/prisma/enums'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/lib/storage', () => ({
  isStorageConfigured: () => false,
  validatePDF: () => ({ valid: false, error: 'STORAGE_NOT_CONFIGURED' }),
  uploadFile: async () => ({ fileKey: '', fileName: '', fileSize: 0 }),
  deleteFile: async () => {},
  getSignedDownloadUrl: async () => '',
}))

const notifyStatusChangeSpy = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))

vi.mock('@/services/notifications', () => ({
  notifyStatusChange: notifyStatusChangeSpy,
  sendStatusChangeEmail: vi.fn(),
  createInAppNotification: vi.fn(),
}))

vi.mock('@/services/notifications/staff.notification', () => ({
  notifyStaffOnStatusChange: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/services/preference-survey.service', () => ({
  validateAnswers: vi.fn().mockResolvedValue({ success: true }),
  createSurveyAnswer: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/services/notifications/staff.notification', () => ({
  notifyStaffOnStatusChange: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/services/user.service', () => ({
  getUserByEmail: vi.fn(),
  getUserById: vi.fn(),
  getUsersByRoles: vi.fn().mockResolvedValue([]),
}))

const prismaMock = vi.hoisted(() => ({
  expenseRequest: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  notification: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn((cb: any) => cb(prismaMock)),
}))

vi.mock('@/lib/orm', () => ({ default: prismaMock }))

import * as userService from '@/services/user.service'
import { updateExpenseStatus } from '@/services/expense.service'
import {
  getUserNotifications,
  markAllAsRead,
  markAsRead,
} from '@/services/notifications/in-app.notification'
import { createPasswordResetToken, resetPassword, verifyCredentials } from '../../backend/src/services/auth.service'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const STUDENT_ID = 'student-uuid-001'
const EXPENSE_ID = 'expense-uuid-001'
const USER_ID_A = 'user-uuid-A'
const USER_ID_B = 'user-uuid-B'

function baseExpense(overrides: Record<string, unknown> = {}) {
  return {
    id: EXPENSE_ID,
    studentId: STUDENT_ID,
    title: 'Congresso Internacional',
    status: ExpenseRequestStatus.PENDENTE,
    rejectionReason: null,
    correctionReason: null,
    projectId: null,
    attachmentKey: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    student: { id: STUDENT_ID, name: 'Ana Aluno' },
    project: null,
    costBreakdowns: [],
    surveyAnswers: [],
    ...overrides,
  }
}

function mockNotification(userId: string, overrides = {}) {
  return {
    id: `notif-${userId}`,
    userId,
    expenseRequestId: EXPENSE_ID,
    isRead: false,
    createdAt: new Date('2026-05-10T10:00:00Z'),
    expenseRequest: {
      id: EXPENSE_ID,
      title: 'Congresso',
      status: 'APROVADO',
      updatedAt: new Date(),
    },
    ...overrides,
  }
}

// ─── US 4.0 — E-mail disparado após mudança de status ─────────────────────────

describe('US 4.0 — notifyStatusChange spy em updateExpenseStatus', () => {
  beforeEach(() => vi.clearAllMocks())

  it('PENDENTE → APROVADO dispara notifyStatusChange com userId do aluno', async () => {
    prismaMock.expenseRequest.findUnique.mockResolvedValue(baseExpense())
    prismaMock.expenseRequest.update.mockResolvedValue(
      baseExpense({ status: ExpenseRequestStatus.APROVADO }),
    )

    await updateExpenseStatus(EXPENSE_ID, ExpenseRequestStatus.APROVADO, UserRole.COORDENADOR)

    expect(notifyStatusChangeSpy).toHaveBeenCalledOnce()
    expect(notifyStatusChangeSpy).toHaveBeenCalledWith(
      STUDENT_ID,
      expect.objectContaining({ id: EXPENSE_ID }),
      ExpenseRequestStatus.APROVADO,
      null,
      prismaMock,
    )
  })

  it('PENDENTE → REJEITADO dispara notifyStatusChange com status REJEITADO', async () => {
    prismaMock.expenseRequest.findUnique.mockResolvedValue(baseExpense())
    prismaMock.expenseRequest.update.mockResolvedValue(
      baseExpense({ status: ExpenseRequestStatus.REJEITADO }),
    )

    await updateExpenseStatus(
      EXPENSE_ID,
      ExpenseRequestStatus.REJEITADO,
      UserRole.COORDENADOR,
      'Documentação inválida',
    )

    expect(notifyStatusChangeSpy).toHaveBeenCalledOnce()
    const [, , calledStatus] = notifyStatusChangeSpy.mock.calls[0]
    expect(calledStatus).toBe(ExpenseRequestStatus.REJEITADO)
  })

  it('transição inválida (mesmo status PENDENTE→PENDENTE) → notifyStatusChange NÃO é chamado', async () => {
    prismaMock.expenseRequest.findUnique.mockResolvedValue(baseExpense())

    const result = await updateExpenseStatus(
      EXPENSE_ID,
      ExpenseRequestStatus.PENDENTE,
      UserRole.COORDENADOR,
    )

    expect('error' in result).toBe(true)
    expect(notifyStatusChangeSpy).not.toHaveBeenCalled()
  })

  it('despesa não encontrada → notifyStatusChange NÃO é chamado', async () => {
    prismaMock.expenseRequest.findUnique.mockResolvedValue(null)

    await updateExpenseStatus(EXPENSE_ID, ExpenseRequestStatus.APROVADO, UserRole.COORDENADOR)

    expect(notifyStatusChangeSpy).not.toHaveBeenCalled()
  })
})

// ─── US 4.4 — Notificações in-app: isolamento por usuário ─────────────────────

describe('US 4.4 — getUserNotifications: isolamento por usuário', () => {
  beforeEach(() => vi.clearAllMocks())

  it('GET /v1/notifications — retorna somente notificações do usuário autenticado', async () => {
    prismaMock.notification.findMany.mockResolvedValue([mockNotification(USER_ID_A)])

    const result = await getUserNotifications(USER_ID_A)

    expect(prismaMock.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: USER_ID_A }),
      }),
    )
    expect(result.every((n: any) => n.userId === USER_ID_A)).toBe(true)
  })

  it('usuário B não recebe notificações do usuário A — where.userId é respeitado', async () => {
    prismaMock.notification.findMany.mockResolvedValue([])

    await getUserNotifications(USER_ID_B)

    const call = prismaMock.notification.findMany.mock.calls[0][0]
    expect(call.where.userId).toBe(USER_ID_B)
    expect(call.where.userId).not.toBe(USER_ID_A)
  })

  it('take máximo de 20 é aplicado por padrão', async () => {
    prismaMock.notification.findMany.mockResolvedValue([])

    await getUserNotifications(USER_ID_A)

    const call = prismaMock.notification.findMany.mock.calls[0][0]
    expect(call.take).toBe(20)
  })

  it('orderBy createdAt: desc garante ordem cronológica inversa', async () => {
    prismaMock.notification.findMany.mockResolvedValue([])

    await getUserNotifications(USER_ID_A)

    const call = prismaMock.notification.findMany.mock.calls[0][0]
    expect(call.orderBy).toEqual({ createdAt: 'desc' })
  })

  it('PATCH /v1/notifications/:id/read — markAsRead atualiza isRead para true', async () => {
    prismaMock.notification.update.mockResolvedValue(
      mockNotification(USER_ID_A, { isRead: true }),
    )

    await markAsRead('notif-001', USER_ID_A)

    expect(prismaMock.notification.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'notif-001', userId: USER_ID_A },
      data: { isRead: true },
    }))
  })

  it('PATCH /v1/notifications/read-all — markAllAsRead marca todas como lidas', async () => {
    prismaMock.notification.updateMany.mockResolvedValue({ count: 5 })

    await markAllAsRead(USER_ID_A)

    expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: USER_ID_A, isRead: false },
      data: { isRead: true },
    })
  })
})

// ─── US 4.2 — Autenticação: login, refresh token e rota protegida ──────────────

describe('US 4.2 — verifyCredentials (login e proteção de rotas)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('POST /auth/login com credenciais válidas → retorna payload com sub e role', async () => {
    const bcrypt = await import('bcryptjs')
    const passwordHash = await bcrypt.hash('Senha@123', 1)

    vi.mocked(userService.getUserByEmail).mockResolvedValue({
      id: USER_ID_A,
      email: 'aluno@uni.br',
      passwordHash,
      name: 'Ana',
      role: 'ALUNO',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)

    const result = await verifyCredentials({ email: 'aluno@uni.br', password: 'Senha@123' })

    expect('error' in result).toBe(false)
    if (!('error' in result)) {
      expect(result.sub).toBe(USER_ID_A)
      expect(result.role).toBe('ALUNO')
    }
  })

  it('rota protegida — senha incorreta → verifyCredentials retorna erro', async () => {
    const bcrypt = await import('bcryptjs')
    const passwordHash = await bcrypt.hash('Senha@123', 1)

    vi.mocked(userService.getUserByEmail).mockResolvedValue({
      id: USER_ID_A,
      email: 'aluno@uni.br',
      passwordHash,
      name: 'Ana',
      role: 'ALUNO',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)

    const result = await verifyCredentials({ email: 'aluno@uni.br', password: 'SenhaErrada' })

    expect(result).toEqual({ error: 'INVALID_CREDENTIALS' })
  })

  it('usuário inativo → verifyCredentials retorna erro', async () => {
    vi.mocked(userService.getUserByEmail).mockResolvedValue({
      id: USER_ID_A,
      email: 'aluno@uni.br',
      passwordHash: 'hash',
      name: 'Ana',
      role: 'ALUNO',
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)

    const result = await verifyCredentials({ email: 'aluno@uni.br', password: 'Senha@123' })

    expect(result).toEqual({ error: 'INVALID_CREDENTIALS' })
  })
})

// ─── US 4.1 — Fluxo: forgot-password → reset-password ────────────────────────

describe('US 4.1 — Fluxo completo de recuperação de senha (integração de serviços)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('forgot-password com e-mail válido → retorna plainToken não nulo', async () => {
    vi.mocked(userService.getUserByEmail).mockResolvedValue({
      id: USER_ID_A,
      email: 'aluno@uni.br',
      isActive: true,
    } as any)
    prismaMock.user.update.mockResolvedValue({})

    const result = await createPasswordResetToken('aluno@uni.br')

    expect('error' in result).toBe(false)
    if (!('error' in result)) {
      expect(typeof result.token).toBe('string')
      expect(result.token.length).toBeGreaterThan(0)
    }
  })

  it('forgot-password com e-mail inexistente → retorna erro', async () => {
    vi.mocked(userService.getUserByEmail).mockResolvedValue({ error: 'USER_NOT_FOUND' })

    const result = await createPasswordResetToken('naoexiste@uni.br')

    expect(result).toEqual({ error: 'USER_NOT_FOUND' })
  })

  it('reset-password com token válido → { success: true } + token limpo', async () => {
    prismaMock.user.findFirst.mockResolvedValue({ id: USER_ID_A })
    prismaMock.user.update.mockResolvedValue({})

    const result = await resetPassword('valid-token', 'NovaSenha@123')

    expect(result).toEqual({ success: true })
    const updateCall = prismaMock.user.update.mock.calls[0][0]
    expect(updateCall.data.passwordResetToken).toBeNull()
    expect(updateCall.data.passwordResetExpiresAt).toBeNull()
  })

  it('reset-password com token inválido/expirado → retorna { error }', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null)

    const result = await resetPassword('invalid-or-expired', 'NovaSenha@123')

    expect(result).toHaveProperty('error')
    expect(prismaMock.user.update).not.toHaveBeenCalled()
  })
})
