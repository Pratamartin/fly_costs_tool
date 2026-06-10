import type { Prisma, UserSession } from '@/generated/prisma/client'
import type { ServiceResult } from '@/lib/problems'
import type { AppAuthPayload } from '@/lib/type'
import type { LoginSchema } from '@/schemas/auth.schema'
import crypto, { randomUUID } from 'node:crypto'
import { z } from '@hono/zod-openapi'
import bcrypt, { compare } from 'bcryptjs'
import { sign, verify } from 'hono/jwt'
import { PASSWORD_RESET_TOKEN_EXPIRES_IN_HOURS } from '@/constants/auth.constant'
import { mockInviteCode } from '@/constants/invite.constant'
import env from '@/env'
import { UserRole } from '@/generated/prisma/client'
import { dayjs } from '@/lib/date'
import prisma from '@/lib/orm'
import { getUserByEmail } from './user.service'

/** @deprecated Use findActiveInvite from invite.service instead for real database validation */
export function isInviteCodeValid(inviteCode: string): boolean {
  return inviteCode === mockInviteCode
}

export async function verifyCredentials(
  data: z.infer<typeof LoginSchema>,
): Promise<ServiceResult<AppAuthPayload, 'INVALID_CREDENTIALS'>> {
  const result = await getUserByEmail(data.email)

  if ('error' in result || !result.isActive || !(await compare(data.password, result.passwordHash))) {
    return { error: 'INVALID_CREDENTIALS' }
  }

  const user = result

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

export const sessionInclude = { user: true } satisfies Prisma.UserSessionInclude

export type SessionWithUser = Prisma.UserSessionGetPayload<{
  include: typeof sessionInclude
}>

export async function createSession(userId: string): Promise<UserSession> {
  const jti = randomUUID()
  const expiresAt = dayjs().add(env.REFRESH_TOKEN_EXPIRES_DAYS, 'day')
    .toDate()

  return prisma.userSession.create({
    data: {
      jti,
      userId,
      expiresAt,
    },
  })
}

export async function generateRefreshToken(payload: AppAuthPayload, jti: string): Promise<string> {
  const token = await sign(
    {
      ...payload,
      jti,
      exp: dayjs().add(env.REFRESH_TOKEN_EXPIRES_DAYS, 'day')
        .unix(),
    },
    env.JWT_REFRESH_SECRET,
  )

  return token
}

export async function verifyRefreshToken(token: string): Promise<ServiceResult<AppAuthPayload & { jti: string }, 'UNAUTHORIZED'>> {
  try {
    const rawPayload = await verify(token, env.JWT_REFRESH_SECRET, 'HS256')
    const payload = z.object({
      sub: z.string(),
      role: z.enum(UserRole),
      jti: z.string(),
    }).parse(rawPayload)

    return payload as AppAuthPayload & { jti: string }
  }
  catch {
    return { error: 'UNAUTHORIZED' }
  }
}

export async function validateSession(jti: string): Promise<ServiceResult<SessionWithUser, 'UNAUTHORIZED'>> {
  const session = await prisma.userSession.findUnique({
    where: { jti },
    include: sessionInclude,
  })

  if (!session || session.revokedAt || dayjs().isAfter(session.expiresAt) || !session.user.isActive) {
    return { error: 'UNAUTHORIZED' }
  }

  return session
}
export async function extendSession(jti: string): Promise<ServiceResult<UserSession, 'UNAUTHORIZED'>> {
  try {
    const expiresAt = dayjs().add(env.REFRESH_TOKEN_EXPIRES_DAYS, 'day')
      .toDate()

    return await prisma.userSession.update({
      where: { jti },
      data: { expiresAt },
    })
  }
  catch {
    return { error: 'UNAUTHORIZED' }
  }
}
export async function revokeSession(jti: string): Promise<ServiceResult<{ success: true }, 'UNAUTHORIZED'>> {
  const result = await prisma.userSession.updateMany({
    where: { jti },
    data: { revokedAt: new Date() },
  })

  if (result.count === 0) {
    return { error: 'UNAUTHORIZED' }
  }

  return { success: true }
}

export async function createPasswordResetToken(email: string): Promise<ServiceResult<{ token: string }, 'USER_NOT_FOUND'>> {
  const result = await getUserByEmail(email)

  if ('error' in result || !result.isActive) {
    return { error: 'USER_NOT_FOUND' }
  }

  const user = result

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

  return { token: plainToken }
}

export async function resetPassword(token: string, newPassword: string): Promise<ServiceResult<{ success: true }, 'INVALID_TOKEN'>> {
  const hashedToken = crypto.createHash('sha256').update(token)
    .digest('hex')

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpiresAt: { gt: dayjs().toDate() },
    },
  })

  if (!user) {
    return { error: 'INVALID_TOKEN' }
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
