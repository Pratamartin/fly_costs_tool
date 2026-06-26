import { describe, expect, it, vi } from 'vitest'
import { cpf } from 'cpf-cnpj-validator'
import { generateAccessToken, isInviteCodeValid, verifyCredentials } from '../../backend/src/services/auth.service'
import { RegisterSchema } from '@/schemas/auth.schema'
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

// ─── isInviteCodeValid (deprecated) ──────────────────────────────────────────

describe('isInviteCodeValid', () => {
  it('retorna true para código hardcoded CONVITE2026', () => {
    expect(isInviteCodeValid('CONVITE2026')).toBe(true)
  })

  it('retorna false para código inválido', () => {
    expect(isInviteCodeValid('INVALIDO')).toBe(false)
  })

  it('retorna false para código vazio', () => {
    expect(isInviteCodeValid('')).toBe(false)
  })
})

// ─── verifyCredentials ────────────────────────────────────────────────────────

describe('verifyCredentials', () => {
  it('retorna erro quando usuário não existe', async () => {
    vi.mocked(userService.getUserByEmail).mockResolvedValue({ error: 'USER_NOT_FOUND' })

    const result = await verifyCredentials({
      email: 'naoexiste@test.com',
      password: 'senha123',
    })

    expect(result).toEqual({ error: 'INVALID_CREDENTIALS' })
  })

  it('retorna erro quando senha está incorreta', async () => {
    vi.mocked(userService.getUserByEmail).mockResolvedValue({
      id: '1',
      email: 'test@test.com',
      passwordHash: '$2a$10$invalidhash',
      name: 'Test',
      role: 'ALUNO',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const result = await verifyCredentials({
      email: 'test@test.com',
      password: 'senhaerrada',
    })

    expect(result).toEqual({ error: 'INVALID_CREDENTIALS' })
  })
})

// ─── generateAccessToken ──────────────────────────────────────────────────────

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

// ─── T3.1.2 — Validação RegisterSchema ───────────────────────────────────────

// cpf.generate() produz CPF válido (com algoritmo correto) para o zCpf() validator
const VALID_CPF = cpf.generate()

const VALID_ALUNO_PAYLOAD = {
  name: 'João Silva',
  email: 'joao@test.com',
  password: 'Test@1234',
  role: 'ALUNO' as const,
  inviteCode: 'CONVITE2026',
  cpf: VALID_CPF,
  rgPassaporte: 'MG-12.345.678',
  pixKey: VALID_CPF,
  birthDate: '2000-01-01T00:00:00.000Z',
  profession: 'Estudante',
  address: 'Rua das Flores, 123',
  bankCode: '001',
  bankName: 'BANCO DO BRASIL',
  bankAgency: '1234-5',
  bankAccount: '12345678',
}

describe('RegisterSchema — T3.1.2 (unit)', () => {
  it('aceita payload completo de ALUNO com dados bancários', () => {
    const r = RegisterSchema.safeParse(VALID_ALUNO_PAYLOAD)
    expect(r.success).toBe(true)
  })

  it('aceita payload de ADMIN sem dados de profile', () => {
    const r = RegisterSchema.safeParse({
      name: 'Admin',
      email: 'admin@test.com',
      password: 'Test@1234',
      role: 'ADMIN',
      inviteCode: 'CONVITE2026',
    })
    expect(r.success).toBe(true)
  })

  it('aceita payload de COORDENADOR sem dados de profile', () => {
    const r = RegisterSchema.safeParse({
      name: 'Coord',
      email: 'coord@test.com',
      password: 'Test@1234',
      role: 'COORDENADOR',
      inviteCode: 'CONVITE2026',
    })
    expect(r.success).toBe(true)
  })

  it('rejeita sem inviteCode', () => {
    const { inviteCode: _, ...withoutInvite } = VALID_ALUNO_PAYLOAD
    const r = RegisterSchema.safeParse(withoutInvite)
    expect(r.success).toBe(false)
  })

  it('rejeita senha sem letra maiúscula', () => {
    const r = RegisterSchema.safeParse({ ...VALID_ALUNO_PAYLOAD, password: 'test@1234' })
    expect(r.success).toBe(false)
  })

  it('rejeita senha sem caractere especial', () => {
    const r = RegisterSchema.safeParse({ ...VALID_ALUNO_PAYLOAD, password: 'TestUser1234' })
    expect(r.success).toBe(false)
  })

  it('rejeita senha com menos de 8 caracteres', () => {
    const r = RegisterSchema.safeParse({ ...VALID_ALUNO_PAYLOAD, password: 'T@1a' })
    expect(r.success).toBe(false)
  })

  it('rejeita role inválido', () => {
    const r = RegisterSchema.safeParse({ ...VALID_ALUNO_PAYLOAD, role: 'SUPERUSER' })
    expect(r.success).toBe(false)
  })

  it('rejeita email malformado', () => {
    const r = RegisterSchema.safeParse({ ...VALID_ALUNO_PAYLOAD, email: 'nao-e-email' })
    expect(r.success).toBe(false)
  })

  it('rejeita ADMIN com campos extras do profile (strict)', () => {
    const r = RegisterSchema.safeParse({
      name: 'Admin',
      email: 'admin@test.com',
      password: 'Test@1234',
      role: 'ADMIN',
      inviteCode: 'CONVITE2026',
      cpf: '000.000.000-00',
    })
    expect(r.success).toBe(false)
  })
})
