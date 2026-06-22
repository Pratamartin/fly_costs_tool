import type { CreateRoute, IndexRoute, RemoveRoute } from './invites.route'
import type { AppRouteHandler } from '@/lib/type'
import * as codes from 'stoker/http-status-codes'
import { problems } from '@/lib/problems'
import { InviteResponseSchema, ListInvitesSchema } from '@/schemas/admin.invite.schema'
import { createInvite, getInviteDefaultExpiry, listInvites, mapInviteStatus, revokeInvite } from '@/services/invite.service'

export const index: AppRouteHandler<IndexRoute> = async (c) => {
  const query = c.req.valid('query')
  const invites = await listInvites(query)
  const parsed = ListInvitesSchema.parse(invites)
  return c.json(parsed, codes.OK)
}

export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const { role, expiresAt } = c.req.valid('json')
  const invite = await createInvite(role, expiresAt || getInviteDefaultExpiry())
  const status = mapInviteStatus(invite)

  const parsed = InviteResponseSchema.parse({
    ...invite,
    status,
  })
  return c.json(parsed, codes.CREATED)
}

export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
  const { id } = c.req.valid('param')
  const result = await revokeInvite(id)

  if (result && 'error' in result) {
    throw problems.create(result.error, { extensions: result.context })
  }

  return c.body(null, codes.NO_CONTENT)
}
