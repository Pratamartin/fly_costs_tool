import { describe, expect, it, vi } from 'vitest'
import { createUser, getUserByEmail, getUserById } from '../../backend/src/services/user.service'
import prisma from '../../backend/src/lib/orm'

vi.mock('../../backend/src/lib/orm', () => ({
  default: {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

describe('createUser', () => {
  it('cria usuário com dados corretos', async () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@test.com',
      role: 'ALUNO',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    vi.mocked(prisma.user.create).mockResolvedValue({
      ...mockUser,
      passwordHash: 'hash',
    })

    const result = await createUser(
      {
        name: 'Test User',
        email: 'test@test.com',
        password: 'senha123',
        role: 'ALUNO',
        inviteCode: 'CONVITE2026',
      },
      10
    )

    expect(result).toBeDefined()
    expect(result.email).toBe('test@test.com')
    expect(prisma.user.create).toHaveBeenCalled()
  })
})

describe('getUserByEmail', () => {
  it('retorna usuário quando existe', async () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@test.com',
      passwordHash: 'hash',
      role: 'ALUNO',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)

    const result = await getUserByEmail('test@test.com')

    expect(result).toEqual(mockUser)
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@test.com' },
    })
  })

  it('retorna null quando usuário não existe', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const result = await getUserByEmail('naoexiste@test.com')

    expect(result).toBeNull()
  })
})

describe('getUserById', () => {
  it('retorna usuário sem passwordHash', async () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@test.com',
      role: 'ALUNO',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)

    const result = await getUserById('1')

    expect(result).toEqual(mockUser)
    expect(result).not.toHaveProperty('passwordHash')
  })

  it('retorna null quando usuário não existe', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const result = await getUserById('999')

    expect(result).toBeNull()
  })
})
