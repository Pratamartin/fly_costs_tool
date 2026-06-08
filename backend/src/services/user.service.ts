import type { z } from '@hono/zod-openapi'
import type { Prisma } from '@/generated/prisma/client'
import type { ProfileCreateWithoutUserInput } from '@/generated/prisma/models'
import type { ServiceResult } from '@/lib/problems'
import type { RegisterSchema } from '@/schemas/auth.schema'
import type { UpdateProfileSchema } from '@/schemas/user.schema'
import bcrypt from 'bcryptjs'
import { ROLES_ALLOWED_TO_HAVE_PROFILE } from '@/constants/user.constant'
import prisma from '@/lib/orm'

const omit = { passwordHash: true }

type CreateUserDTO = z.infer<typeof RegisterSchema>
type UpdateUserDTO = z.infer<typeof UpdateProfileSchema>

export async function createUser(data: CreateUserDTO, saltRounds: number, tx: Prisma.TransactionClient = prisma) {
  const { name, email, role, password, inviteCode: _ } = data

  const salt = await bcrypt.genSalt(saltRounds)
  const hash = await bcrypt.hash(password, salt)

  const profileData: ProfileCreateWithoutUserInput | undefined = data.role === 'ALUNO'
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

  return tx.user.create({
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

export type UserWithProfile = Prisma.UserGetPayload<{ omit: typeof omit, include: { profile: true } }>

export async function getUserByEmail(email: string): Promise<ServiceResult<Prisma.UserGetPayload<object>, 'USER_NOT_FOUND'>> {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return { error: 'USER_NOT_FOUND' }
  }
  return user
}

export async function getUserById(id: string, tx: Prisma.TransactionClient = prisma): Promise<ServiceResult<UserWithProfile, 'USER_NOT_FOUND'>> {
  const user = await tx.user.findUnique({
    where: { id },
    omit,
    include: { profile: true },
  })

  if (!user) {
    return { error: 'USER_NOT_FOUND' }
  }

  return user
}

export async function updateUser(id: string, data: UpdateUserDTO): Promise<ServiceResult<UserWithProfile, 'USER_NOT_FOUND' | 'FORBIDDEN' | 'CPF_CONFLICT' | 'PROFILE_NOT_ALLOWED'>> {
  const { name, ...profileData } = data

  const result = await getUserById(id)

  if ('error' in result) {
    return result
  }

  const user = result

  const hasProfileData = Object.values(profileData).some(val => val !== undefined)

  if (!ROLES_ALLOWED_TO_HAVE_PROFILE.includes(user.role) && hasProfileData) {
    return { error: 'PROFILE_NOT_ALLOWED' }
  }

  if (profileData.cpf && profileData.cpf !== user.profile?.cpf) {
    const cpfInUseByAnotherUser = await prisma.profile.findFirst({
      where: {
        cpf: profileData.cpf,
        userId: { not: id },
      },
      select: { id: true },
    })

    if (cpfInUseByAnotherUser) {
      return { error: 'CPF_CONFLICT' }
    }
  }

  return prisma.user.update({
    where: { id },
    data: {
      name,
      profile: hasProfileData
        ? {
            upsert: {
              create: profileData,
              update: profileData,
            },
          }
        : undefined,
    },
    omit,
    include: { profile: true },
  })
}
