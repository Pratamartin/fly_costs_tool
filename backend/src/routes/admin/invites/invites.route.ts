import { createRoute, z } from '@hono/zod-openapi'
import * as codes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { INVITE_EXPIRY } from '@/constants/invite.constant'
import { UserRole } from '@/generated/prisma/enums'
import { registryResponses, standardResponses } from '@/lib/problems'
import { requireAuth, requireRole } from '@/middlewares'

import { CreateInviteSchema, InviteResponseSchema, ListInvitesQuerySchema, ListInvitesSchema } from '@/schemas/admin.invite.schema'
import { IdSchema } from '@/schemas/shared.schema'

const tags = ['Invites']
const middleware = [requireAuth, requireRole([UserRole.ADMIN])]

export type IndexRoute = typeof index
export type CreateRoute = typeof create
export type RemoveRoute = typeof remove

export const index = createRoute({
  path: '/',
  method: 'get',
  middleware,
  security: [{ bearerAuth: [] }],
  summary: 'List all invites',
  description: 'Returns a list of all generated invite codes, with their statuses (ACTIVE, USED, EXPIRED).',
  tags,
  request: { query: ListInvitesQuerySchema },
  responses: {
    [codes.OK]: jsonContent(ListInvitesSchema, 'Invite list retrieved successfully.'),
    ...registryResponses('UNAUTHORIZED', 'FORBIDDEN'),
  },
})

export const create = createRoute({
  path: '/',
  method: 'post',
  middleware,
  security: [{ bearerAuth: [] }],
  summary: 'Create a new invite code',
  description: `Generates a new random invite code for a specific role. If not provided, the default expiration is ${INVITE_EXPIRY.DEFAULT_HOURS} hours. The expiration date must be at least ${INVITE_EXPIRY.MIN_MINUTES} minutes after creation and must follow the UTC standard.`,
  tags,
  request: { body: jsonContentRequired(CreateInviteSchema, 'Invite data') },
  responses: {
    [codes.CREATED]: jsonContent(InviteResponseSchema, 'Invite created successfully.'),
    ...standardResponses,
    ...registryResponses('BAD_REQUEST'),
  },
})

export const remove = createRoute({
  path: '/{id}',
  method: 'delete',
  middleware,
  security: [{ bearerAuth: [] }],
  summary: 'Revoke an invite code',
  description: 'Invalidates an invite code (soft delete: sets expiresAt to current time).',
  tags,
  request: { params: z.object({ id: IdSchema }) },
  responses: {
    [codes.NO_CONTENT]: { description: 'Invite revoked successfully.' },
    ...registryResponses('INVITE_NOT_FOUND', 'INVITE_CONFLICT', 'UNAUTHORIZED', 'FORBIDDEN'),
  },
})
