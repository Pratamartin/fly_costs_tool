/**
 * US 4.4 — Central de Notificações In-App
 * Unit: persistência de Notification ao chamar createInAppNotification
 * Integration (service-level): getUserNotifications, markAsRead, markAllAsRead
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const prismaMock = vi.hoisted(() => ({
  notification: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  $transaction: vi.fn((cb: any) => cb(prismaMock)),
}))

vi.mock('@/lib/orm', () => ({ default: prismaMock }))

import {
  createInAppNotification,
  getUserNotifications,
  markAllAsRead,
  markAsRead,
} from '@/services/notifications/in-app.notification'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const USER_ID = 'user-uuid-001'
const OTHER_USER_ID = 'user-uuid-002'
const EXPENSE_ID = 'expense-uuid-001'
const NOTIFICATION_ID = 'notif-uuid-001'

function mockNotification(overrides = {}) {
  return {
    id: NOTIFICATION_ID,
    userId: USER_ID,
    expenseRequestId: EXPENSE_ID,
    isRead: false,
    createdAt: new Date('2026-05-10T10:00:00Z'),
    expenseRequest: {
      id: EXPENSE_ID,
      title: 'Congresso Internacional',
      status: 'APROVADO',
      updatedAt: new Date('2026-05-10T09:00:00Z'),
    },
    ...overrides,
  }
}

// ─── createInAppNotification ──────────────────────────────────────────────────

describe('createInAppNotification', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama tx.notification.create com userId e expenseRequestId corretos', async () => {
    const txMock = { notification: { create: vi.fn().mockResolvedValue(mockNotification()) } }

    await createInAppNotification({ userId: USER_ID, expenseRequestId: EXPENSE_ID }, txMock as any)

    expect(txMock.notification.create).toHaveBeenCalledOnce()
    expect(txMock.notification.create).toHaveBeenCalledWith({
      data: {
        userId: USER_ID,
        expenseRequestId: EXPENSE_ID,
      },
    })
  })

  it('registro criado tem isRead: false por padrão (campo não enviado = valor default do banco)', async () => {
    const txMock = {
      notification: {
        create: vi.fn().mockResolvedValue(mockNotification({ isRead: false })),
      },
    }

    const result = await createInAppNotification(
      { userId: USER_ID, expenseRequestId: EXPENSE_ID },
      txMock as any,
    )

    expect(result.isRead).toBe(false)
  })

  it('sem tx explícito, usa prisma padrão', async () => {
    prismaMock.notification.create.mockResolvedValue(mockNotification())

    await createInAppNotification({ userId: USER_ID, expenseRequestId: EXPENSE_ID })

    expect(prismaMock.notification.create).toHaveBeenCalledOnce()
  })

  it('registros de usuários distintos não se mesclam — userId é preservado', async () => {
    prismaMock.notification.create.mockResolvedValue(mockNotification({ userId: OTHER_USER_ID }))

    await createInAppNotification({ userId: OTHER_USER_ID, expenseRequestId: EXPENSE_ID })

    const call = prismaMock.notification.create.mock.calls[0][0]
    expect(call.data.userId).toBe(OTHER_USER_ID)
  })
})

// ─── getUserNotifications ─────────────────────────────────────────────────────

describe('getUserNotifications', () => {
  beforeEach(() => vi.clearAllMocks())

  it('filtra somente pelo userId autenticado', async () => {
    prismaMock.notification.findMany.mockResolvedValue([mockNotification()])

    await getUserNotifications(USER_ID)

    const call = prismaMock.notification.findMany.mock.calls[0][0]
    expect(call.where.userId).toBe(USER_ID)
  })

  it('ordena por createdAt descendente', async () => {
    prismaMock.notification.findMany.mockResolvedValue([])

    await getUserNotifications(USER_ID)

    const call = prismaMock.notification.findMany.mock.calls[0][0]
    expect(call.orderBy).toEqual({ createdAt: 'desc' })
  })

  it('limite padrão é 20 registros', async () => {
    prismaMock.notification.findMany.mockResolvedValue([])

    await getUserNotifications(USER_ID)

    const call = prismaMock.notification.findMany.mock.calls[0][0]
    expect(call.take).toBe(20)
  })

  it('limit customizado respeita o parâmetro filters.limit', async () => {
    prismaMock.notification.findMany.mockResolvedValue([])

    await getUserNotifications(USER_ID, { limit: 5 })

    const call = prismaMock.notification.findMany.mock.calls[0][0]
    expect(call.take).toBe(5)
  })

  it('filtro unreadOnly=true adiciona cláusula isRead: false', async () => {
    prismaMock.notification.findMany.mockResolvedValue([])

    await getUserNotifications(USER_ID, { unreadOnly: true })

    const call = prismaMock.notification.findMany.mock.calls[0][0]
    expect(call.where.isRead).toBe(false)
  })

  it('sem unreadOnly, não filtra por isRead', async () => {
    prismaMock.notification.findMany.mockResolvedValue([])

    await getUserNotifications(USER_ID)

    const call = prismaMock.notification.findMany.mock.calls[0][0]
    expect(call.where).not.toHaveProperty('isRead')
  })

  it('inclui expenseRequest com campos id, title, status, updatedAt', async () => {
    prismaMock.notification.findMany.mockResolvedValue([mockNotification()])

    await getUserNotifications(USER_ID)

    const call = prismaMock.notification.findMany.mock.calls[0][0]
    expect(call.include?.expenseRequest?.select).toMatchObject({
      id: true,
      title: true,
      status: true,
      updatedAt: true,
    })
  })
})

// ─── markAsRead ───────────────────────────────────────────────────────────────

describe('markAsRead', () => {
  beforeEach(() => vi.clearAllMocks())

  it('atualiza isRead para true com where combinando id e userId', async () => {
    prismaMock.notification.update.mockResolvedValue(mockNotification({ isRead: true }))

    await markAsRead(NOTIFICATION_ID, USER_ID)

    expect(prismaMock.notification.update).toHaveBeenCalledWith({
      where: { id: NOTIFICATION_ID, userId: USER_ID },
      data: { isRead: true },
    })
  })

  it('não marca notificação de outro usuário — where.userId isola o dono', async () => {
    prismaMock.notification.update.mockResolvedValue(mockNotification())

    await markAsRead(NOTIFICATION_ID, OTHER_USER_ID)

    const call = prismaMock.notification.update.mock.calls[0][0]
    expect(call.where.userId).toBe(OTHER_USER_ID)
  })
})

// ─── markAllAsRead ────────────────────────────────────────────────────────────

describe('markAllAsRead', () => {
  beforeEach(() => vi.clearAllMocks())

  it('atualiza todas as notificações não lidas do usuário para isRead: true', async () => {
    prismaMock.notification.updateMany.mockResolvedValue({ count: 3 })

    await markAllAsRead(USER_ID)

    expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: USER_ID, isRead: false },
      data: { isRead: true },
    })
  })

  it('where.userId limita atualização ao usuário correto', async () => {
    prismaMock.notification.updateMany.mockResolvedValue({ count: 0 })

    await markAllAsRead(USER_ID)

    const call = prismaMock.notification.updateMany.mock.calls[0][0]
    expect(call.where.userId).toBe(USER_ID)
    expect(call.where.isRead).toBe(false)
  })
})
