import type { z } from '@hono/zod-openapi'
import type { ProfileCreateWithoutUserInput } from '@/generated/prisma/models'
import type { RegisterSchema } from '@/schemas/auth.schema'
import bcrypt from 'bcryptjs'
import { UserRole } from '@/generated/prisma/client'
import prisma from '@/lib/orm'

const omit = { passwordHash: true }

type CreateUserDTO = z.infer<typeof RegisterSchema>

export async function createUser(data: CreateUserDTO, saltRounds: number) {
  const { name, email, role, password, inviteCode: _ } = data

  const salt = await bcrypt.genSalt(saltRounds)
  const hash = await bcrypt.hash(password, salt)

  const profileData: ProfileCreateWithoutUserInput | undefined = data.role === UserRole.ALUNO
    ? {
        cpf: data.cpf,
        rgPassaporte: data.rgPassaporte,
        birthDate: data.birthDate,
        profession: data.profession,
        address: data.address,
        bankCode: data.bankCode,
        bankName: data.bankName,
        bankAgency: data.bankAgency,
        bankAccount: data.bankAccount,
      }
    : undefined

  return prisma.user.create({
    data: {
      name,
      email,
      role,
      passwordHash: hash,
      profile: profileData ? { create: profileData } : undefined,
    },
    omit,
    include: { profile: true },
  })
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } })
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    omit,
    include: { profile: true },
  })

  return user
}
