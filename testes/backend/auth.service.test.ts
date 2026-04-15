import { describe, expect, it, vi } from 'vitest'
import { generateAccessToken, isInviteCodeValid, verifyCredentials } from '../../backend/src/services/auth.service'
import * as userService from '../../backend/src/services/user.service'

vi.mock('../../backend/src/services/user.service')
vi.mock('../../backend/src/env', () => ({
  default: {
    JWT_SECRET: 'test-secret',
    JWT_EXPIRES_IN: 3600,
    SALT_ROUNDS: 10,
    PORT: 3001,
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    ALLOWED_ORIGINS: ['http://localhost:3000'],
    DATABASE_URL: 'postgresql://test',
  },
}))

vi.mock('../../backend/src/lib/orm', () => ({
  default: {},
}))

vi.mock('../../backend/src/generated/prisma/client', () => ({
  PrismaClient: vi.fn(),
}))

describe('isInviteCodeValid', () => {
  it('retorna true para código válido', () => {
    expect(isInviteCodeValid('CONVITE2026')).toBe(true)
  })

  it('retorna false para código inválido', () => {
    expect(isInviteCodeValid('INVALIDO')).toBe(false)
  })

  it('retorna false para código vazio', () => {
    expect(isInviteCodeValid('')).toBe(false)
  })
})

describe('verifyCredentials', () => {
  it('retorna null quando usuário não existe', async () => {
    vi.mocked(userService.getUserByEmail).mockResolvedValue(null)
    
    const result = await verifyCredentials({
      email: 'naoexiste@test.com',
      password: 'senha123',
    })

    expect(result).toBeNull()
  })

  it('retorna null quando senha está incorreta', async () => {
    vi.mocked(userService.getUserByEmail).mockResolvedValue({
      id: '1',
      email: 'test@test.com',
      passwordHash: '$2a$10$invalidhash',
      name: 'Test',
      role: 'ALUNO',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const result = await verifyCredentials({
      email: 'test@test.com',
      password: 'senhaerrada',
    })

    expect(result).toBeNull()
  })
})

describe('generateAccessToken', () => {
  it('gera token com payload correto', async () => {
    const payload = {
      sub: '123',
      role: 'ALUNO' as const,
    }

    const token = await generateAccessToken(payload, 'secret')

    expect(token).toBeDefined()
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)
  })
})
