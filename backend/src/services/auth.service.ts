import type { z } from 'zod'
import type { AppAuthPayload } from '@/lib/type'
import type { LoginSchema } from '@/schemas/auth.schema'
import { compare } from 'bcryptjs'
import { sign } from 'hono/jwt'
import env from '@/env'
import { getUserByEmail } from './user.service'

export const mockInviteCode = 'CONVITE2026'

export function isInviteCodeValid(inviteCode: string): boolean {
  return inviteCode === mockInviteCode
}

export async function verifyCredentials(
  data: z.infer<typeof LoginSchema>,
): Promise<AppAuthPayload | null> {
  const user = await getUserByEmail(data.email)

  if (!user || !(await compare(data.password, user.passwordHash))) {
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
      exp: Math.floor(Date.now() / 1000) + env.JWT_EXPIRES_IN,
    },
    secret,
  )

  return token
}
