import { beforeEach, describe, expect, it, vi } from 'vitest'
import { INVITE_STATUS } from '@/constants/invite.constant'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const prismaMock = vi.hoisted(() => ({
  inviteCode: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('@/lib/orm', () => ({ default: prismaMock }))

vi.mock('@/env', () => ({
  default: {
    JWT_SECRET: 'test-secret',
    JWT_EXPIRES_IN: 3600,
    DATABASE_URL: 'postgresql://test',
  },
}))

// dayjs não é mockado — usamos datas reais (passado/futuro) para controlar validade
import {
  createInvite,
  findInviteByCode,
  mapInviteStatus,
  revokeInvite,
  validateAndConsume,
} from '@/services/invite.service'
import { UserRole } from '@/generated/prisma/enums'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PAST = new Date('2020-01-01T00:00:00Z')
const FUTURE = new Date('2099-12-31T00:00:00Z')
const USER_ID = 'user-uuid-new'
const INVITE_ID = 'invite-uuid-001'

function inviteRow(overrides: Record<string, unknown> = {}) {
  return {
    id: INVITE_ID,
    code: 'ABCD1234',
    role: UserRole.ALUNO,
    expiresAt: FUTURE,
    usedById: null as string | null,
    usedAt: null as Date | null,
    createdAt: new Date(),
    ...overrides,
  }
}

// ─── T3.2.1 — mapInviteStatus ─────────────────────────────────────────────────

describe('mapInviteStatus — T3.2.1 (unit)', () => {
  it('retorna USADO quando usedById está preenchido', () => {
    const invite = inviteRow({ usedById: 'some-user-id' })
    expect(mapInviteStatus(invite)).toBe(INVITE_STATUS.USED)
  })

  it('retorna EXPIRADO quando expiresAt está no passado e não foi usado', () => {
    const invite = inviteRow({ expiresAt: PAST, usedById: null })
    expect(mapInviteStatus(invite)).toBe(INVITE_STATUS.EXPIRED)
  })

  it('retorna ATIVO quando válido no tempo e não utilizado', () => {
    const invite = inviteRow({ expiresAt: FUTURE, usedById: null })
    expect(mapInviteStatus(invite)).toBe(INVITE_STATUS.ACTIVE)
  })

  it('USADO tem prioridade sobre EXPIRADO', () => {
    const invite = inviteRow({ expiresAt: PAST, usedById: 'algum-id' })
    expect(mapInviteStatus(invite)).toBe(INVITE_STATUS.USED)
  })
})

// ─── T3.2.1 — createInvite ────────────────────────────────────────────────────

describe('createInvite — T3.2.1 (unit)', () => {
  beforeEach(() => {
    prismaMock.inviteCode.create.mockReset()
  })

  it('gera código único (8 chars hex maiúsculo) e persiste no banco', async () => {
    prismaMock.inviteCode.create.mockImplementation(async ({ data }: { data: { code: string, role: string, expiresAt: Date } }) =>
      inviteRow({ code: data.code, role: data.role, expiresAt: data.expiresAt }),
    )

    const result = await createInvite(UserRole.ALUNO)

    expect(prismaMock.inviteCode.create).toHaveBeenCalledOnce()
    expect(result.code).toMatch(/^[A-F0-9]{8}$/)
    expect(result.role).toBe(UserRole.ALUNO)
    expect(result.expiresAt).toBeInstanceOf(Date)
  })

  it('usa expiresAt customizado quando fornecido', async () => {
    const customExpiry = new Date('2026-12-31T23:59:59Z')
    prismaMock.inviteCode.create.mockImplementation(async ({ data }: { data: { expiresAt: Date } }) =>
      inviteRow({ expiresAt: data.expiresAt }),
    )

    const result = await createInvite(UserRole.COORDENADOR, customExpiry)

    const call = prismaMock.inviteCode.create.mock.calls[0][0] as { data: { expiresAt: Date } }
    expect(call.data.expiresAt).toEqual(customExpiry)
    expect(result.expiresAt).toEqual(customExpiry)
  })

  it('dois convites gerados possuem códigos diferentes', async () => {
    let callCount = 0
    prismaMock.inviteCode.create.mockImplementation(async ({ data }: { data: { code: string } }) => {
      callCount++
      return inviteRow({ code: data.code, id: `invite-${callCount}` })
    })

    const r1 = await createInvite(UserRole.ALUNO)
    const r2 = await createInvite(UserRole.ALUNO)

    expect(r1.code).not.toBe(r2.code)
  })
})

// ─── T3.2.1 — findInviteByCode ───────────────────────────────────────────────

describe('findInviteByCode — T3.2.1 (unit)', () => {
  beforeEach(() => {
    prismaMock.inviteCode.findUnique.mockReset()
  })

  it('retorna erro quando convite não existe', async () => {
    prismaMock.inviteCode.findUnique.mockResolvedValue(null)

    const result = await findInviteByCode('NAO-EXISTE')

    expect('error' in result && result.error).toBe('INVITE_NOT_FOUND')
    expect(prismaMock.inviteCode.findUnique).toHaveBeenCalledWith({
      where: { code: 'NAO-EXISTE' },
    })
  })

  it('retorna erro quando convite está expirado', async () => {
    prismaMock.inviteCode.findUnique.mockResolvedValue(
      inviteRow({ expiresAt: PAST, usedById: null }),
    )

    const result = await findInviteByCode('EXPIRED-CODE')

    expect('error' in result && result.error).toBe('INVITE_ALREADY_EXPIRED')
  })

  it('retorna erro quando convite já foi utilizado', async () => {
    prismaMock.inviteCode.findUnique.mockResolvedValue(
      inviteRow({ usedById: 'outro-user-id', expiresAt: FUTURE }),
    )

    const result = await findInviteByCode('USED-CODE')

    expect('error' in result && result.error).toBe('INVITE_ALREADY_USED')
  })

  it('retorna o convite quando válido e não utilizado', async () => {
    const activeInvite = inviteRow({ expiresAt: FUTURE, usedById: null })
    prismaMock.inviteCode.findUnique.mockResolvedValue(activeInvite)

    const result = await findInviteByCode('VALID-CODE')

    expect('error' in result).toBe(false)
    if (!('error' in result)) {
      expect(result.id).toBe(INVITE_ID)
    }
  })
})

// ─── T3.2.1 — validateAndConsume ─────────────────────────────────────────────

describe('validateAndConsume — T3.2.1 (unit)', () => {
  beforeEach(() => {
    prismaMock.inviteCode.findUnique.mockReset()
    prismaMock.inviteCode.update.mockReset()
  })

  it('retorna erro quando convite é inválido', async () => {
    prismaMock.inviteCode.findUnique.mockResolvedValue(null)

    const result = await validateAndConsume('INVALIDO', USER_ID)

    expect('error' in result).toBe(true)
    expect(prismaMock.inviteCode.update).not.toHaveBeenCalled()
  })

  it('retorna erro quando convite está expirado', async () => {
    prismaMock.inviteCode.findUnique.mockResolvedValue(
      inviteRow({ expiresAt: PAST, usedById: null }),
    )

    const result = await validateAndConsume('EXPIRED-CODE', USER_ID)

    expect('error' in result).toBe(true)
    expect(prismaMock.inviteCode.update).not.toHaveBeenCalled()
  })

  it('retorna erro quando convite já foi usado', async () => {
    prismaMock.inviteCode.findUnique.mockResolvedValue(
      inviteRow({ usedById: 'outro-user', expiresAt: FUTURE }),
    )

    const result = await validateAndConsume('USED-CODE', USER_ID)

    expect('error' in result).toBe(true)
    expect(prismaMock.inviteCode.update).not.toHaveBeenCalled()
  })

  it('marca convite como usado com usedById e usedAt preenchidos', async () => {
    prismaMock.inviteCode.findUnique.mockResolvedValue(
      inviteRow({ expiresAt: FUTURE, usedById: null }),
    )
    prismaMock.inviteCode.update.mockImplementation(async ({ data }: { data: { usedById: string, usedAt: Date } }) =>
      inviteRow({ usedById: data.usedById, usedAt: data.usedAt }),
    )

    const result = await validateAndConsume('VALID-CODE', USER_ID)

    expect('error' in result).toBe(false)
    expect(prismaMock.inviteCode.update).toHaveBeenCalledOnce()

    const updateCall = prismaMock.inviteCode.update.mock.calls[0][0] as {
      where: { id: string }
      data: { usedById: string, usedAt: Date }
    }
    expect(updateCall.data.usedById).toBe(USER_ID)
    expect(updateCall.data.usedAt).toBeInstanceOf(Date)
    expect(updateCall.where.id).toBe(INVITE_ID)
  })
})

// ─── T3.2.1 — revokeInvite ────────────────────────────────────────────────────

describe('revokeInvite — T3.2.1 (unit)', () => {
  beforeEach(() => {
    prismaMock.inviteCode.findUnique.mockReset()
    prismaMock.inviteCode.update.mockReset()
  })

  it('retorna NOT_FOUND quando convite não existe', async () => {
    prismaMock.inviteCode.findUnique.mockResolvedValue(null)

    const result = await revokeInvite('nao-existe')

    expect('error' in result).toBe(true)
    expect(prismaMock.inviteCode.update).not.toHaveBeenCalled()
  })

  it('retorna ALREADY_USED quando convite já foi utilizado', async () => {
    prismaMock.inviteCode.findUnique.mockResolvedValue(
      inviteRow({ usedById: 'algum-user', expiresAt: FUTURE }),
    )

    const result = await revokeInvite(INVITE_ID)

    expect('error' in result && result.error).toBe('INVITE_ALREADY_USED')
    expect(prismaMock.inviteCode.update).not.toHaveBeenCalled()
  })

  it('retorna ALREADY_EXPIRED quando convite já está expirado', async () => {
    prismaMock.inviteCode.findUnique.mockResolvedValue(
      inviteRow({ expiresAt: PAST, usedById: null }),
    )

    const result = await revokeInvite(INVITE_ID)

    expect('error' in result && result.error).toBe('INVITE_ALREADY_EXPIRED')
    expect(prismaMock.inviteCode.update).not.toHaveBeenCalled()
  })

  it('revoga convite ativo setando expiresAt para agora', async () => {
    prismaMock.inviteCode.findUnique.mockResolvedValue(
      inviteRow({ expiresAt: FUTURE, usedById: null }),
    )
    prismaMock.inviteCode.update.mockResolvedValue(inviteRow({ expiresAt: new Date() }))

    const before = new Date()
    const result = await revokeInvite(INVITE_ID)
    const after = new Date()

    expect('error' in result).toBe(false)
    const updateCall = prismaMock.inviteCode.update.mock.calls[0][0] as {
      data: { expiresAt: Date }
    }
    expect(updateCall.data.expiresAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(updateCall.data.expiresAt.getTime()).toBeLessThanOrEqual(after.getTime())
  })
})

