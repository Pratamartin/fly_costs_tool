import type { z } from '@hono/zod-openapi'
import type { ProfileCreateWithoutUserInput } from '@/generated/prisma/models'
import type { RegisterSchema } from '@/schemas/auth.schema'
import type { UpdateProfileSchema } from '@/schemas/user.schema'
import bcrypt from 'bcryptjs'
import * as phrases from 'stoker/http-status-phrases'
import { ROLES_ALLOWED_TO_HAVE_PROFILE, USER_ERROR_CODES } from '@/constants/user.constant'
import prisma from '@/lib/orm'

const omit = { passwordHash: true }

type CreateUserDTO = z.infer<typeof RegisterSchema>
type UpdateUserDTO = z.infer<typeof UpdateProfileSchema>

export async function createUser(data: CreateUserDTO, saltRounds: number) {
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

export async function updateUser(id: string, data: UpdateUserDTO) {
  const { name, ...profileData } = data

  const user = await getUserById(id)

  if (!user) {
    return { error: phrases.NOT_FOUND }
  }

  const hasProfileData = Object.values(profileData).some(val => val !== undefined)

  if (!ROLES_ALLOWED_TO_HAVE_PROFILE.includes(user.role) && hasProfileData) {
    return { error: USER_ERROR_CODES.PROFILE_UPDATE_NOT_ALLOWED }
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
      return { error: USER_ERROR_CODES.CPF_ALREADY_USED }
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
