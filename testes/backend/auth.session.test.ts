/**
 * US 5.0 — Refresh Token / Sessão
 * Unit: createSession, generateRefreshToken, verifyRefreshToken, 
 *       validateSession, extendSession, revokeSession
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { randomUUID } from 'node:crypto'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('node:crypto', () => ({
  randomUUID: vi.fn(() => 'mocked-jti-uuid'),
}))

const prismaMock = vi.hoisted(() => ({
  userSession: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
}))

vi.mock('@/lib/orm', () => ({ default: prismaMock }))

vi.mock('@/services/user.service', () => ({
  getUserByEmail: vi.fn(),
}))

// ─── Imports ──────────────────────────────────────────────────────────────────

import {
  createSession,
  generateRefreshToken,
  verifyRefreshToken,
  validateSession,
  extendSession,
  revokeSession,
} from '@/services/auth.service'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const USER_ID = 'user-uuid-001'
const VALID_JTI = 'valid-jti-001'
const INVALID_JTI = 'nonexistent-jti'

const FUTURE = new Date('2099-12-31T00:00:00Z')
const PAST = new Date('2020-01-01T00:00:00Z')

function mockSession(overrides: Record<string, unknown> = {}) {
  return {
    id: 'session-uuid-001',
    jti: VALID_JTI,
    userId: USER_ID,
    expiresAt: FUTURE,
    revokedAt: null,
    createdAt: new Date(),
    ...overrides,
  }
}

function mockSessionWithUser(overrides: Record<string, unknown> = {}) {
  return {
    ...mockSession(overrides),
    user: {
      id: USER_ID,
      name: 'Ana Aluno',
      email: 'ana@universidade.br',
      role: 'ALUNO',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...(overrides.user || {}),
    },
  }
}

function mockPayload() {
  return { sub: USER_ID, role: 'ALUNO' as const }
}

// ─── createSession ────────────────────────────────────────────────────────────

describe('createSession', () => {
  beforeEach(() => vi.clearAllMocks())

  it('cria sessão com jti, userId e expiresAt', async () => {
    const jti = 'fixed-jti'
    vi.mocked(randomUUID).mockReturnValue(jti)
    prismaMock.userSession.create.mockResolvedValue(mockSession({ jti }))

    const session = await createSession(USER_ID)

    expect(session.jti).toBe(jti)
    expect(session.userId).toBe(USER_ID)
    expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now())

    expect(prismaMock.userSession.create).toHaveBeenCalledOnce()
    const callArgs = prismaMock.userSession.create.mock.calls[0][0] as any
    expect(callArgs.data.jti).toBe(jti)
    expect(callArgs.data.userId).toBe(USER_ID)
    expect(callArgs.data.expiresAt).toBeDefined()
  })

  it('usa randomUUID para gerar jti único', async () => {
    vi.mocked(randomUUID).mockReturnValue('unique-jti')
    prismaMock.userSession.create.mockResolvedValue(mockSession({ jti: 'unique-jti' }))

    await createSession(USER_ID)

    expect(randomUUID).toHaveBeenCalledOnce()
  })

  it('define expiresAt para o futuro', async () => {
    prismaMock.userSession.create.mockImplementation(
      async (args: any) => mockSession({ expiresAt: args.data.expiresAt }),
    )

    const session = await createSession(USER_ID)

    expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now())
  })
})

// ─── generateRefreshToken ─────────────────────────────────────────────────────

describe('generateRefreshToken', () => {
  it('retorna string com três partes (JWT)', async () => {
    const token = await generateRefreshToken(mockPayload(), VALID_JTI)

    expect(token).toBeDefined()
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)
  })

  it('codifica sub, role e jti no payload', async () => {
    const token = await generateRefreshToken(mockPayload(), VALID_JTI)

    const payload = JSON.parse(
      Buffer.from(token.split('.')[1]!, 'base64url').toString(),
    )

    expect(payload.sub).toBe(USER_ID)
    expect(payload.role).toBe('ALUNO')
    expect(payload.jti).toBe(VALID_JTI)
  })

  it('cada chamada gera token diferente (exp diferente)', async () => {
    const t1 = await generateRefreshToken(mockPayload(), VALID_JTI)
    const t2 = await generateRefreshToken(mockPayload(), 'outro-jti')

    expect(t1).not.toBe(t2)
  })
})

// ─── verifyRefreshToken ───────────────────────────────────────────────────────

describe('verifyRefreshToken', () => {
  it('retorna payload para token válido', async () => {
    const jti = 'test-jti-123'
    const token = await generateRefreshToken(mockPayload(), jti)

    const result = await verifyRefreshToken(token)

    expect('error' in result).toBe(false)
    if (!('error' in result)) {
      expect(result.sub).toBe(USER_ID)
      expect(result.role).toBe('ALUNO')
      expect(result.jti).toBe(jti)
    }
  })

  it('retorna UNAUTHORIZED para token inválido', async () => {
    const result = await verifyRefreshToken('invalid.token.string')

    expect('error' in result).toBe(true)
    if ('error' in result) {
      expect(result.error).toBe('UNAUTHORIZED')
    }
  })

  it('retorna UNAUTHORIZED para token com payload malformado', async () => {
    const result = await verifyRefreshToken('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.invalidsig')

    expect('error' in result).toBe(true)
    if ('error' in result) {
      expect(result.error).toBe('UNAUTHORIZED')
    }
  })
})

// ─── validateSession ──────────────────────────────────────────────────────────

describe('validateSession', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna sessão quando jti é válido', async () => {
    prismaMock.userSession.findUnique.mockResolvedValue(mockSessionWithUser())

    const result = await validateSession(VALID_JTI)

    expect('error' in result).toBe(false)
    if (!('error' in result)) {
      expect(result.jti).toBe(VALID_JTI)
      expect(result.user.isActive).toBe(true)
    }
  })

  it('retorna UNAUTHORIZED quando sessão não existe', async () => {
    prismaMock.userSession.findUnique.mockResolvedValue(null)

    const result = await validateSession(INVALID_JTI)

    expect('error' in result && result.error).toBe('UNAUTHORIZED')
  })

  it('retorna UNAUTHORIZED quando sessão está revogada', async () => {
    prismaMock.userSession.findUnique.mockResolvedValue(
      mockSessionWithUser({ revokedAt: new Date() }),
    )

    const result = await validateSession(VALID_JTI)

    expect('error' in result && result.error).toBe('UNAUTHORIZED')
  })

  it('retorna UNAUTHORIZED quando expiresAt passou', async () => {
    prismaMock.userSession.findUnique.mockResolvedValue(
      mockSessionWithUser({ expiresAt: PAST }),
    )

    const result = await validateSession(VALID_JTI)

    expect('error' in result && result.error).toBe('UNAUTHORIZED')
  })

  it('retorna UNAUTHORIZED quando usuário está inativo', async () => {
    prismaMock.userSession.findUnique.mockResolvedValue(
      mockSessionWithUser({ user: { isActive: false } }),
    )

    const result = await validateSession(VALID_JTI)

    expect('error' in result && result.error).toBe('UNAUTHORIZED')
  })

  it('inclui dados do usuário na sessão retornada', async () => {
    prismaMock.userSession.findUnique.mockResolvedValue(mockSessionWithUser())

    const result = await validateSession(VALID_JTI)

    expect('error' in result).toBe(false)
    if (!('error' in result)) {
      expect(result.user.id).toBe(USER_ID)
      expect(result.user.role).toBe('ALUNO')
      expect(result.user.name).toBe('Ana Aluno')
    }
  })
})

// ─── extendSession ────────────────────────────────────────────────────────────

describe('extendSession', () => {
  beforeEach(() => vi.clearAllMocks())

  it('atualiza expiresAt para nova data futura', async () => {
    prismaMock.userSession.update.mockResolvedValue(mockSession())

    const result = await extendSession(VALID_JTI)

    expect('error' in result).toBe(false)
    if (!('error' in result)) {
      expect(result.jti).toBe(VALID_JTI)
    }

    expect(prismaMock.userSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { jti: VALID_JTI },
        data: expect.objectContaining({
          expiresAt: expect.any(Date),
        }),
      }),
    )
  })

  it('retorna UNAUTHORIZED quando jti não existe', async () => {
    prismaMock.userSession.update.mockRejectedValue(new Error('Not found'))

    const result = await extendSession(INVALID_JTI)

    expect('error' in result && result.error).toBe('UNAUTHORIZED')
  })
})

// ─── revokeSession ────────────────────────────────────────────────────────────

describe('revokeSession', () => {
  beforeEach(() => vi.clearAllMocks())

  it('define revokedAt na sessão', async () => {
    prismaMock.userSession.updateMany.mockResolvedValue({ count: 1 })

    const result = await revokeSession(VALID_JTI)

    expect('error' in result).toBe(false)
    if (!('error' in result)) {
      expect(result.success).toBe(true)
    }

    expect(prismaMock.userSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { jti: VALID_JTI },
        data: expect.objectContaining({
          revokedAt: expect.any(Date),
        }),
      }),
    )
  })

  it('retorna UNAUTHORIZED quando jti não existe', async () => {
    prismaMock.userSession.updateMany.mockResolvedValue({ count: 0 })

    const result = await revokeSession(INVALID_JTI)

    expect('error' in result && result.error).toBe('UNAUTHORIZED')
  })

  it('retorna UNAUTHORIZED quando nenhum registro é afetado', async () => {
    prismaMock.userSession.updateMany.mockResolvedValue({ count: 0 })

    const result = await revokeSession(VALID_JTI)

    expect('error' in result && result.error).toBe('UNAUTHORIZED')
  })
})
