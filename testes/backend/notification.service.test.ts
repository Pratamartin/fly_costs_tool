/**
 * US 4.0 — Notificação de Mudança de Status
 * Unit: sendStatusChangeEmail — mockar emailService e verificar
 * parâmetros corretos para cada transição de status.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ExpenseRequestStatus } from '@/generated/prisma/client'

// ─── Mock: jobManager (via @/lib/jobs alias em vitest.config.ts) ──────────────
// @/jobs/index.ts importa @/lib/jobs (mocado), então jobManager.emit é no-op.

const emailServiceMock = vi.hoisted(() => ({
  send: vi.fn().mockResolvedValue({ success: true, queued: true, jobId: 'job-1' }),
}))

vi.mock('@/lib/email/service', () => ({
  emailService: emailServiceMock,
  EmailService: vi.fn(),
}))

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  notification: {
    create: vi.fn(),
  },
  $transaction: vi.fn((cb: any) => cb(prismaMock)),
}))

vi.mock('@/lib/orm', () => ({ default: prismaMock }))

vi.mock('@/services/user.service', () => ({
  getUserById: vi.fn(),
}))

import * as userService from '@/services/user.service'
import { sendStatusChangeEmail } from '@/services/notifications/email.notification'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const USER_ID = 'user-uuid-001'
const EXPENSE_ID = 'expense-uuid-001'

function mockUser(overrides = {}) {
  return {
    id: USER_ID,
    name: 'Ana Aluno',
    email: 'ana@universidade.br',
    role: 'ALUNO',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

function mockExpense(overrides = {}) {
  return {
    id: EXPENSE_ID,
    title: 'Congressso Internacional',
    rejectionReason: null as string | null,
    correctionReason: null as string | null,
    updatedAt: new Date('2026-05-10'),
    attachmentKey: null as string | null,
    project: { name: 'Projeto Alpha' } as { name: string } | null,
    ...overrides,
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('sendStatusChangeEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(userService.getUserById).mockResolvedValue(mockUser() as any)
    emailServiceMock.send.mockResolvedValue({ success: true, queued: true, jobId: 'job-1' })
  })

  it('dispara e-mail com destinatário correto (to = e-mail do aluno)', async () => {
    await sendStatusChangeEmail(USER_ID, mockExpense(), ExpenseRequestStatus.APROVADO)

    expect(emailServiceMock.send).toHaveBeenCalledOnce()
    const [input] = emailServiceMock.send.mock.calls[0]
    expect(input.to).toBe('ana@universidade.br')
  })

  it('assunto contém o título da despesa', async () => {
    await sendStatusChangeEmail(USER_ID, mockExpense(), ExpenseRequestStatus.APROVADO)

    const [input] = emailServiceMock.send.mock.calls[0]
    expect(input.subject).toContain('Congressso Internacional')
  })

  it('template type é status-change', async () => {
    await sendStatusChangeEmail(USER_ID, mockExpense(), ExpenseRequestStatus.APROVADO)

    const [input] = emailServiceMock.send.mock.calls[0]
    expect(input.template?.type).toBe('status-change')
  })

  it('transição APROVADO — props.newStatus é APROVADO e sem reason', async () => {
    await sendStatusChangeEmail(USER_ID, mockExpense(), ExpenseRequestStatus.APROVADO)

    const [input] = emailServiceMock.send.mock.calls[0]
    expect(input.template?.props.newStatus).toBe(ExpenseRequestStatus.APROVADO)
    expect(input.template?.props.reason).toBeNull()
  })

  it('transição REJEITADO — props.reason recebe rejectionReason da despesa', async () => {
    const expense = mockExpense({ rejectionReason: 'Documentação incompleta' })
    await sendStatusChangeEmail(USER_ID, expense, ExpenseRequestStatus.REJEITADO)

    const [input] = emailServiceMock.send.mock.calls[0]
    expect(input.template?.props.newStatus).toBe(ExpenseRequestStatus.REJEITADO)
    expect(input.template?.props.reason).toBe('Documentação incompleta')
  })

  it('transição EM_EDICAO — props.reason recebe correctionReason da despesa', async () => {
    const expense = mockExpense({ correctionReason: 'Comprovante ilegível' })
    await sendStatusChangeEmail(USER_ID, expense, ExpenseRequestStatus.EM_EDICAO)

    const [input] = emailServiceMock.send.mock.calls[0]
    expect(input.template?.props.newStatus).toBe(ExpenseRequestStatus.EM_EDICAO)
    expect(input.template?.props.reason).toBe('Comprovante ilegível')
  })

  it('transição EM_EDICAO — detailPage aponta para rota /edit/:id', async () => {
    await sendStatusChangeEmail(USER_ID, mockExpense(), ExpenseRequestStatus.EM_EDICAO)

    const [input] = emailServiceMock.send.mock.calls[0]
    expect(input.template?.props.detailPage).toContain(`/edit/${EXPENSE_ID}`)
  })

  it('transições não-EM_EDICAO — detailPage aponta para rota /detail/:id', async () => {
    await sendStatusChangeEmail(USER_ID, mockExpense(), ExpenseRequestStatus.APROVADO)

    const [input] = emailServiceMock.send.mock.calls[0]
    expect(input.template?.props.detailPage).toContain(`/detail/${EXPENSE_ID}`)
  })

  it('singletonKey passado como options inclui expenseId e status', async () => {
    await sendStatusChangeEmail(USER_ID, mockExpense(), ExpenseRequestStatus.APROVADO)

    const [, options] = emailServiceMock.send.mock.calls[0]
    expect(options?.singletonKey).toContain(EXPENSE_ID)
    expect(options?.singletonKey).toContain('APROVADO')
  })

  it('quando usuário não encontrado, e-mail não é disparado', async () => {
    vi.mocked(userService.getUserById).mockResolvedValue(null)

    await sendStatusChangeEmail(USER_ID, mockExpense(), ExpenseRequestStatus.APROVADO)

    expect(emailServiceMock.send).not.toHaveBeenCalled()
  })

  it('parâmetro extra sobrescreve reason calculado', async () => {
    const expense = mockExpense({ rejectionReason: 'Motivo padrão' })
    await sendStatusChangeEmail(
      USER_ID,
      expense,
      ExpenseRequestStatus.REJEITADO,
      'Motivo extra personalizado',
    )

    const [input] = emailServiceMock.send.mock.calls[0]
    expect(input.template?.props.reason).toBe('Motivo extra personalizado')
  })

  it('hasMemorandum é true quando attachmentKey está preenchido', async () => {
    const expense = mockExpense({ attachmentKey: 'memorandos/2026/memo.pdf' })
    await sendStatusChangeEmail(USER_ID, expense, ExpenseRequestStatus.APROVADO)

    const [input] = emailServiceMock.send.mock.calls[0]
    expect(input.template?.props.hasMemorandum).toBe(true)
  })

  it('hasMemorandum é false quando attachmentKey é null', async () => {
    await sendStatusChangeEmail(USER_ID, mockExpense(), ExpenseRequestStatus.APROVADO)

    const [input] = emailServiceMock.send.mock.calls[0]
    expect(input.template?.props.hasMemorandum).toBe(false)
  })
})
