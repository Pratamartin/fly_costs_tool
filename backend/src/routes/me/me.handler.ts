import type { IndexRoute } from './me.route'
import type { AppRouteHandler } from '@/lib/type'
import * as codes from 'stoker/http-status-codes'
import { getUserById } from '@/services/user.service'

export const index: AppRouteHandler<IndexRoute> = async (c) => {
  const { sub } = c.get('jwtPayload')

  const userProfile = await getUserById(sub)

  if (!userProfile) {
    return c.json({ message: 'Usuário não encontrado no sistema' }, codes.NOT_FOUND)
  }

  return c.json(userProfile, codes.OK)
}
