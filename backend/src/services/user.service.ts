import type { z } from '@hono/zod-openapi'
import type { RegisterSchema } from '@/schemas/auth.schema'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/orm'

const omit = { passwordHash: true }

type CreateUserDTO = z.infer<typeof RegisterSchema>

export async function createUser(data: CreateUserDTO, saltRounds: number) {
  const { password, inviteCode, ...other } = data
  const salt = await bcrypt.genSalt(saltRounds)
  const hash = await bcrypt.hash(password, salt)
  return prisma.user.create({
    data: {
      passwordHash: hash,
      ...other,
    },
    omit,
  })
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    omit,
  })
}
