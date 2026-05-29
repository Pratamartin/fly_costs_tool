import type { z } from '@hono/zod-openapi'
import type { AppAuthPayload } from '@/lib/type'
import type { LoginSchema } from '@/schemas/auth.schema'
import crypto from 'node:crypto'
import bcrypt, { compare } from 'bcryptjs'
import { sign } from 'hono/jwt'
import { AUTH_ERROR_CODES, PASSWORD_RESET_TOKEN_EXPIRES_IN_HOURS } from '@/constants/auth.constant'
import { mockInviteCode } from '@/constants/invite.constant'
import env from '@/env'
import { dayjs } from '@/lib/date'
import prisma from '@/lib/orm'
import { getUserByEmail } from './user.service'

/** @deprecated Use findActiveInvite from invite.service instead for real database validation */
export function isInviteCodeValid(inviteCode: string): boolean {
  return inviteCode === mockInviteCode
}

export async function verifyCredentials(
  data: z.infer<typeof LoginSchema>,
): Promise<AppAuthPayload | null> {
  const user = await getUserByEmail(data.email)

  if (!user || !user.isActive || !(await compare(data.password, user.passwordHash))) {
    return null
  }

  return {
    sub: user.id,
    role: user.role,
  }
}

export async function generateAccessToken(payload: AppAuthPayload, secret: string): Promise<string> {
  const token = await sign(
    {
      ...payload,
      exp: dayjs().unix() + env.JWT_EXPIRES_IN,
    },
    secret,
  )

  return token
}

export async function createPasswordResetToken(email: string): Promise<string | null> {
  const user = await getUserByEmail(email)
  if (!user || !user.isActive) {
    return null
  }

  const plainToken = crypto.randomBytes(32).toString('hex')
  const hashedToken = crypto.createHash('sha256').update(plainToken)
    .digest('hex')
  const expiresAt = dayjs().add(PASSWORD_RESET_TOKEN_EXPIRES_IN_HOURS, 'hour')
    .toDate()

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: hashedToken,
      passwordResetExpiresAt: expiresAt,
    },
  })

  return plainToken
}

export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean } | { error: string }> {
  const hashedToken = crypto.createHash('sha256').update(token)
    .digest('hex')

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpiresAt: { gt: dayjs().toDate() },
    },
  })

  if (!user) {
    return { error: AUTH_ERROR_CODES.INVALID_OR_EXPIRED_TOKEN }
  }

  const newPasswordHash = await bcrypt.hash(newPassword, env.SALT_ROUNDS)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: newPasswordHash,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
    },
  })

  return { success: true }
}
