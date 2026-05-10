import type { LoginRoute, RegisterRoute } from './auth.route'
import type { AppRouteHandler } from '@/lib/type'
import * as codes from 'stoker/http-status-codes'
import env from '@/env'
import prisma from '@/lib/orm'
import { generateAccessToken, verifyCredentials } from '@/services/auth.service'
import { findActiveInvite, validateAndConsume } from '@/services/invite.service'
import { createUser, getUserByEmail } from '@/services/user.service'

export const register: AppRouteHandler<RegisterRoute> = async (c) => {
  const data = c.req.valid('json')

  const existingUser = await getUserByEmail(data.email)
  if (existingUser) {
    return c.json({ message: 'E-mail já cadastrado' }, codes.CONFLICT)
  }

  const result = await prisma.$transaction(async (tx) => {
    const invite = await findActiveInvite(data.inviteCode, tx)
    if (!invite) {
      return { error: 'Código de convite inválido ou expirado' }
    }

    const newUser = await createUser({
      ...data,
      role: invite.role,
    }, env.SALT_ROUNDS, tx)

    const consumeResult = await validateAndConsume(data.inviteCode, newUser.id, tx)
    if ('error' in consumeResult) {
      return consumeResult
    }

    return { data: newUser }
  })

  if ('error' in result) {
    return c.json({ message: result.error || 'Código de convite inválido ou expirado' }, codes.BAD_REQUEST)
  }

  return c.json(result.data, codes.CREATED)
}

export const login: AppRouteHandler<LoginRoute> = async (c) => {
  const data = c.req.valid('json')

  const credentials = await verifyCredentials(data)

  if (!credentials) {
    return c.json({ message: 'Login ou senha inválidos' }, codes.UNAUTHORIZED)
  }

  const accessToken = await generateAccessToken(credentials, env.JWT_SECRET)

  return c.json({ accessToken }, codes.OK)
}
