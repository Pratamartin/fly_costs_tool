import type { IndexRoute, UpdateRoute } from './me.route'
import type { AppRouteHandler } from '@/lib/type'
import * as codes from 'stoker/http-status-codes'
import { problems } from '@/lib/problems'
import { UserSchema } from '@/schemas/user.schema'
import { getUserById, updateUser } from '@/services/user.service'

export const index: AppRouteHandler<IndexRoute> = async (c) => {
  const { sub } = c.get('jwtPayload')

  const result = await getUserById(sub)

  if ('error' in result) {
    throw problems.create(result.error)
  }

  return c.json(result, codes.OK)
}

export const update: AppRouteHandler<UpdateRoute> = async (c) => {
  const { sub } = c.get('jwtPayload')
  const data = c.req.valid('json')

  const result = await updateUser(sub, data)

  if ('error' in result) {
    throw problems.create(result.error)
  }
  const parsed = UserSchema.parse(result)
  return c.json(parsed, codes.OK)
}
