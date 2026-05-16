import { beforeEach, describe, expect, it, vi } from 'vitest'
import { USER_ERROR_CODES } from '@/constants/user.constant'
import { createUser, getUserByEmail, getUserById, updateUser } from '../../backend/src/services/user.service'
import prisma from '../../backend/src/lib/orm'

vi.mock('../../backend/src/lib/orm', () => ({
  default: {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    profile: {
      findFirst: vi.fn(),
    },
  },
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-uuid-001',
    name: 'Test User',
    email: 'test@test.com',
    role: 'ALUNO',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: null as null | Record<string, unknown>,
    ...overrides,
  }
}

function mockProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: 'profile-uuid-001',
    userId: 'user-uuid-001',
    cpf: '000.000.000-00',
    rgPassaporte: 'MG-12345678',
    birthDate: new Date('2000-01-01'),
    profession: 'Estudante',
    address: 'Rua das Flores, 123',
    bankCode: '001',
    bankName: 'BANCO DO BRASIL',
    bankAgency: '1234-5',
    bankAccount: '12345678',
    ...overrides,
  }
}

// ─── T3.1.1 — createUser ──────────────────────────────────────────────────────

describe('createUser — T3.1.1 (unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('persiste dados bancários do aluno no profile aninhado', async () => {
    const profile = mockProfile()
    vi.mocked(prisma.user.create).mockResolvedValue({
      ...mockUser(),
      profile,
    } as never)

    const result = await createUser(
      {
        name: 'Aluno Teste',
        email: 'aluno@test.com',
        password: 'Senha@123',
        role: 'ALUNO',
        inviteCode: 'CONVITE2026',
        cpf: '000.000.000-00',
        bankCode: '001',
        bankName: 'BANCO DO BRASIL',
        bankAgency: '1234-5',
        bankAccount: '12345678',
        rgPassaporte: 'MG-12345678',
        birthDate: '2000-01-01T00:00:00.000Z',
        profession: 'Estudante',
        address: 'Rua das Flores, 123',
      },
      10,
    )

    expect(prisma.user.create).toHaveBeenCalledOnce()

    const call = (vi.mocked(prisma.user.create).mock.lastCall![0] as {
      data: {
        profile?: { create?: Record<string, unknown> }
      }
    })
    const profileCreate = call.data.profile?.create

    expect(profileCreate?.bankCode).toBe('001')
    expect(profileCreate?.bankName).toBe('BANCO DO BRASIL')
    expect(profileCreate?.bankAccount).toBe('12345678')
    expect(result.email).toBe('test@test.com')
  })

  it('CPF duplicado — prisma.user.create lança erro e ele é propagado', async () => {
    const p2002 = Object.assign(new Error('Unique constraint'), { code: 'P2002' })
    vi.mocked(prisma.user.create).mockRejectedValue(p2002)

    await expect(
      createUser(
        {
          name: 'Aluno',
          email: 'duplicado@test.com',
          password: 'Senha@123',
          role: 'ALUNO',
          inviteCode: 'CONVITE2026',
          cpf: '000.000.000-00',
          bankCode: '001',
          bankName: 'BANCO',
          bankAgency: '0001',
          bankAccount: '99999999',
          rgPassaporte: 'RG-123',
          birthDate: '2000-01-01T00:00:00.000Z',
          profession: 'Estudante',
          address: 'Rua A, 1',
        },
        10,
      ),
    ).rejects.toThrow()
  })

  it('campos opcionais omitidos não quebram criação de usuário ALUNO', async () => {
    vi.mocked(prisma.user.create).mockResolvedValue({
      ...mockUser(),
      profile: { cpf: null, bankCode: null, bankAccount: null },
    } as never)

    await expect(
      createUser(
        {
          name: 'Aluno Simples',
          email: 'simples@test.com',
          password: 'Senha@123',
          role: 'ALUNO',
          inviteCode: 'CONVITE2026',
          cpf: null,
          bankCode: null,
          bankName: null,
          bankAgency: null,
          bankAccount: null,
          rgPassaporte: null,
          birthDate: null,
          profession: null,
          address: null,
        },
        10,
      ),
    ).resolves.toBeDefined()
  })

  it('usuário ADMIN não cria profile com dados bancários', async () => {
    vi.mocked(prisma.user.create).mockResolvedValue({
      ...mockUser({ role: 'ADMIN' }),
      profile: null,
    } as never)

    await createUser(
      {
        name: 'Admin Teste',
        email: 'admin@test.com',
        password: 'Senha@123',
        role: 'ADMIN',
        inviteCode: 'CONVITE2026',
      },
      10,
    )

    const call = (vi.mocked(prisma.user.create).mock.lastCall![0] as {
      data: { profile?: unknown }
    })
    expect(call.data.profile).toBeUndefined()
  })
})

// ─── T3.0.1 — updateUser ──────────────────────────────────────────────────────

describe('updateUser — T3.0.1 (unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('atualiza nome com sucesso para usuário existente', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...mockUser({ name: 'Nome Antigo', role: 'ALUNO' }),
      profile: null,
    } as never)
    vi.mocked(prisma.user.update).mockResolvedValue({
      ...mockUser({ name: 'Nome Novo', role: 'ALUNO' }),
      profile: null,
    } as never)

    const result = await updateUser('user-uuid-001', { name: 'Nome Novo' })

    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.name).toBe('Nome Novo')
    expect(prisma.user.update).toHaveBeenCalledOnce()
  })

  it('retorna CPF_ALREADY_USED quando CPF já pertence a outro usuário', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...mockUser({ role: 'ALUNO' }),
      profile: mockProfile({ cpf: '111.111.111-11' }),
    } as never)
    vi.mocked(prisma.profile.findFirst).mockResolvedValue(
      mockProfile({ userId: 'outro-usuario-id' }) as never,
    )

    const result = await updateUser('user-uuid-001', { cpf: '222.222.222-22' })

    expect('error' in result && result.error).toBe(USER_ERROR_CODES.CPF_ALREADY_USED)
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it('CPF igual ao atual não dispara verificação de duplicidade', async () => {
    const cpfAtual = '111.111.111-11'
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...mockUser({ role: 'ALUNO' }),
      profile: mockProfile({ cpf: cpfAtual }),
    } as never)
    vi.mocked(prisma.user.update).mockResolvedValue({
      ...mockUser({ role: 'ALUNO' }),
      profile: mockProfile({ cpf: cpfAtual }),
    } as never)

    await updateUser('user-uuid-001', { cpf: cpfAtual })

    expect(prisma.profile.findFirst).not.toHaveBeenCalled()
    expect(prisma.user.update).toHaveBeenCalledOnce()
  })

  it('salva dados bancários completos via profile upsert', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...mockUser({ role: 'ALUNO' }),
      profile: null,
    } as never)
    vi.mocked(prisma.profile.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.user.update).mockResolvedValue({
      ...mockUser({ role: 'ALUNO' }),
      profile: mockProfile(),
    } as never)

    const result = await updateUser('user-uuid-001', {
      bankCode: '001',
      bankName: 'BANCO DO BRASIL',
      bankAgency: '1234-5',
      bankAccount: '12345678',
    })

    expect('error' in result).toBe(false)

    const updateCall = (vi.mocked(prisma.user.update).mock.lastCall![0] as {
      data: {
        profile?: {
          upsert?: {
            create: Record<string, unknown>
            update: Record<string, unknown>
          }
        }
      }
    })
    const profileUpsert = updateCall.data.profile?.upsert
    expect(profileUpsert?.create.bankCode).toBe('001')
    expect(profileUpsert?.create.bankAccount).toBe('12345678')
  })

  it('usuário não encontrado retorna NOT_FOUND', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const result = await updateUser('nao-existe', { name: 'Qualquer' })

    expect('error' in result).toBe(true)
    expect(prisma.user.update).not.toHaveBeenCalled()
  })
})

// ─── getUserByEmail / getUserById (existentes) ────────────────────────────────

describe('getUserByEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna usuário quando existe', async () => {
    const user = { ...mockUser(), passwordHash: 'hash' }
    vi.mocked(prisma.user.findUnique).mockResolvedValue(user as never)

    const result = await getUserByEmail('test@test.com')

    expect(result).toEqual(user)
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@test.com' } })
  })

  it('retorna null quando usuário não existe', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const result = await getUserByEmail('naoexiste@test.com')

    expect(result).toBeNull()
  })
})

describe('getUserById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna usuário sem passwordHash', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser() as never)

    const result = await getUserById('1')

    expect(result).toBeDefined()
    expect(result).not.toHaveProperty('passwordHash')
  })

  it('retorna null quando usuário não existe', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const result = await getUserById('999')

    expect(result).toBeNull()
  })
})
