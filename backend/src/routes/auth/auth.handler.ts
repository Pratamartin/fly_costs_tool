import type { RegisterRoute } from './auth.route'
import type { AppRouteHandler } from '@/lib/type'
import * as codes from 'stoker/http-status-codes'
import env from '@/env'
import { isInviteCodeValid } from '@/services/auth.service'
import { createUser, getUserByEmail } from '@/services/user.service'

export const register: AppRouteHandler<RegisterRoute> = async (c) => {
  const data = c.req.valid('json')

  if (!isInviteCodeValid(data.inviteCode)) {
    return c.json({ message: 'Código de convite inválido' }, codes.BAD_REQUEST)
  }

  const existingUser = await getUserByEmail(data.email)

  if (existingUser) {
    return c.json({ message: 'E-mail já cadastrado' }, codes.CONFLICT)
  }

  const user = await createUser(data, env.SALT_ROUNDS)

  return c.json(user, codes.CREATED)
}
