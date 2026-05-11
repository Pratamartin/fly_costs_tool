/* eslint-disable no-console */
import type { Prisma } from '@/generated/prisma/client'
import { genSalt, hash } from 'bcryptjs'
import { DEFAULT_USER_PASSWORD, ID_ALUNO, MOCK_PROFILE } from '@/constants/seed.constant'
import env from '@/env'
import { UserRole } from '@/generated/prisma/client'
import prisma from '@/lib/orm'

export const dummyUsers: Omit<Prisma.UserCreateInput, 'passwordHash'>[] = [
  {
    id: 'f3b3e1a2-9b0c-4d1e-8f2g-5h6i7j8k9l0m',
    email: 'coordenador@test.com',
    name: 'Coordenador Acadêmico',
    role: UserRole.COORDENADOR,
  },
  {
    id: '48d413bc-0566-444e-9648-303506d50a61',
    email: 'admin@test.com',
    name: 'Administrador',
    role: UserRole.ADMIN,
  },
  {
    id: ID_ALUNO,
    email: 'aluno@test.com',
    name: 'Codibentinho',
    role: UserRole.ALUNO,
    profile: {
      connectOrCreate: {
        where: { userId: ID_ALUNO },
        create: {
          ...MOCK_PROFILE,
          birthDate: new Date(MOCK_PROFILE.birthDate),
        },
      },
    },
  },
]

async function seedUsers() {
  console.log('🙍🏻‍♂️ Seeding Dummy Users...')

  const salt = await genSalt(Number(env.SALT_ROUNDS) || 10)
  const hashed = await hash(DEFAULT_USER_PASSWORD, salt)

  for (const { id, ...data } of dummyUsers) {
    await prisma.user.upsert({
      where: { id },
      update: {
        ...data,
        passwordHash: hashed,
      },
      create: {
        id,
        ...data,
        passwordHash: hashed,
      },
    })
  }
}

export default seedUsers
