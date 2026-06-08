/**
 * US 4.1 — Recuperação de Senha
 * Unit: geração e hash do token de reset
 * Integration (service-level): createPasswordResetToken, resetPassword
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'

const prismaMock = vi.hoisted(() => ({
  user: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('@/lib/orm', () => ({ default: prismaMock }))

vi.mock('@/services/user.service', () => ({
  getUserByEmail: vi.fn(),
}))

import * as userService from '@/services/user.service'
import {
  createPasswordResetToken,
  resetPassword,
} from '../../backend/src/services/auth.service'
import { AUTH_ERROR_CODES } from '@/constants/auth.constant'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const USER_ID = 'user-uuid-001'
const USER_EMAIL = 'aluno@universidade.br'

function mockActiveUser(overrides = {}) {
  return {
    id: USER_ID,
    name: 'Ana Aluno',
    email: USER_EMAIL,
    isActive: true,
    passwordHash: '$2a$10$somehash',
    passwordResetToken: null as string | null,
    passwordResetExpiresAt: null as Date | null,
    role: 'ALUNO',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

// ─── geração e hash do token de reset ─────────────────────────────────────────

describe('createPasswordResetToken — geração e hash do token', () => {
  beforeEach(() => vi.clearAllMocks())

  it('o token retornado (plainToken) difere do hash salvo no banco', async () => {
    let savedHash: string | undefined
    vi.mocked(userService.getUserByEmail).mockResolvedValue(mockActiveUser() as any)
    prismaMock.user.update.mockImplementation(async ({ data }: any) => {
      savedHash = data.passwordResetToken
      return mockActiveUser({ passwordResetToken: savedHash })
    })

    const result = await createPasswordResetToken(USER_EMAIL)

    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.token).not.toBeNull()
    expect(result.token).not.toBe(savedHash)
  })

  it('SHA-256 do plainToken corresponde ao hash salvo no banco', async () => {
    let savedHash: string | undefined
    vi.mocked(userService.getUserByEmail).mockResolvedValue(mockActiveUser() as any)
    prismaMock.user.update.mockImplementation(async ({ data }: any) => {
      savedHash = data.passwordResetToken
      return mockActiveUser({ passwordResetToken: savedHash })
    })

    const result = await createPasswordResetToken(USER_EMAIL)
    expect('error' in result).toBe(false)
    if ('error' in result) return
    
    const expectedHash = crypto.createHash('sha256').update(result.token).digest('hex')

    expect(savedHash).toBe(expectedHash)
  })

  it('passwordResetExpiresAt é preenchido no update do banco', async () => {
    vi.mocked(userService.getUserByEmail).mockResolvedValue(mockActiveUser() as any)
    prismaMock.user.update.mockResolvedValue(mockActiveUser())

    await createPasswordResetToken(USER_EMAIL)

    const call = prismaMock.user.update.mock.calls[0][0]
    expect(call.data.passwordResetExpiresAt).toBeInstanceOf(Date)
    expect(call.data.passwordResetExpiresAt.getTime()).toBeGreaterThan(Date.now())
  })

  it('dois tokens gerados consecutivamente são diferentes', async () => {
    vi.mocked(userService.getUserByEmail).mockResolvedValue(mockActiveUser() as any)
    prismaMock.user.update.mockResolvedValue(mockActiveUser())

    const res1 = await createPasswordResetToken(USER_EMAIL)
    const res2 = await createPasswordResetToken(USER_EMAIL)

    if ('error' in res1 || 'error' in res2) return
    expect(res1.token).not.toBe(res2.token)
  })

  it('e-mail inexistente retorna USER_NOT_FOUND sem chamar prisma.user.update', async () => {
    vi.mocked(userService.getUserByEmail).mockResolvedValue({ error: 'USER_NOT_FOUND' })

    const result = await createPasswordResetToken('naoexiste@test.com')

    expect(result).toEqual({ error: 'USER_NOT_FOUND' })
    expect(prismaMock.user.update).not.toHaveBeenCalled()
  })

  it('usuário inativo retorna USER_NOT_FOUND', async () => {
    vi.mocked(userService.getUserByEmail).mockResolvedValue(
      mockActiveUser({ isActive: false }) as any,
    )

    const result = await createPasswordResetToken(USER_EMAIL)

    expect(result).toEqual({ error: 'USER_NOT_FOUND' })
  })
})

// ─── resetPassword ─────────────────────────────────────────────────────────────

describe('resetPassword — redefinição de senha', () => {
  beforeEach(() => vi.clearAllMocks())

  it('token válido — retorna { success: true }', async () => {
    prismaMock.user.findFirst.mockResolvedValue(mockActiveUser())
    prismaMock.user.update.mockResolvedValue(mockActiveUser())

    const result = await resetPassword('valid-token-abc', 'NovaSenha@123')

    expect(result).toEqual({ success: true })
  })

  it('token válido — passwordResetToken e passwordResetExpiresAt são limpos', async () => {
    prismaMock.user.findFirst.mockResolvedValue(mockActiveUser())
    prismaMock.user.update.mockResolvedValue(mockActiveUser())

    await resetPassword('valid-token-abc', 'NovaSenha@123')

    const call = prismaMock.user.update.mock.calls[0][0]
    expect(call.data.passwordResetToken).toBeNull()
    expect(call.data.passwordResetExpiresAt).toBeNull()
  })

  it('token válido — nova senha é hasheada antes de salvar', async () => {
    prismaMock.user.findFirst.mockResolvedValue(mockActiveUser())
    prismaMock.user.update.mockResolvedValue(mockActiveUser())

    const plainPassword = 'NovaSenha@123'
    await resetPassword('valid-token-abc', plainPassword)

    const call = prismaMock.user.update.mock.calls[0][0]
    const newHash = call.data.passwordHash
    expect(newHash).not.toBe(plainPassword)
    const valid = await bcrypt.compare(plainPassword, newHash)
    expect(valid).toBe(true)
  })

  it('token expirado/inválido — findFirst retorna null → erro INVALID_TOKEN', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null)

    const result = await resetPassword('expired-or-invalid-token', 'NovaSenha@123')

    expect(result).toEqual({ error: 'INVALID_TOKEN' })
    expect(prismaMock.user.update).not.toHaveBeenCalled()
  })

  it('token já utilizado — findFirst retorna null (token já foi nullado) → erro', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null)

    const result = await resetPassword('already-used-token', 'NovaSenha@123')

    expect(result).toHaveProperty('error')
  })

  it('findFirst busca por hash SHA-256 do token recebido', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null)

    const plainToken = 'qualquer-token-teste'
    await resetPassword(plainToken, 'NovaSenha@123')

    const call = prismaMock.user.findFirst.mock.calls[0][0]
    const expectedHash = crypto.createHash('sha256').update(plainToken).digest('hex')
    expect(call.where.passwordResetToken).toBe(expectedHash)
  })
})
