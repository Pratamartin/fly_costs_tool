import { createRoute, z } from '@hono/zod-openapi'
import * as codes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { createMessageObjectSchema } from 'stoker/openapi/schemas'
import { UserRole } from '@/generated/prisma/enums'
import { requireAuth, requireRole } from '@/middlewares'

import { CreateInviteSchema, InviteResponseSchema, ListInvitesQuerySchema, ListInvitesSchema } from '@/schemas/admin.invite.schema'
import { ForbiddenResponse, IdSchema, UnauthorizedResponse } from '@/schemas/shared.schema'

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
  description: 'Retorna a lista de todos os códigos de convite gerados, com seus status (ATIVO, USADO, EXPIRADO).',
  tags,
  request: { query: ListInvitesQuerySchema },
  responses: {
    [codes.OK]: jsonContent(ListInvitesSchema, 'Lista de convites retornada com sucesso.'),
    [codes.UNAUTHORIZED]: UnauthorizedResponse,
    [codes.FORBIDDEN]: ForbiddenResponse,
  },
})

export const create = createRoute({
  path: '/',
  method: 'post',
  middleware,
  security: [{ bearerAuth: [] }],
  summary: 'Create a new invite code',
  description: 'Gera um novo código de convite aleatório para uma role específica.',
  tags,
  request: { body: jsonContentRequired(CreateInviteSchema, 'Dados do convite') },
  responses: {
    [codes.CREATED]: jsonContent(InviteResponseSchema, 'Convite criado com sucesso.'),
    [codes.UNAUTHORIZED]: UnauthorizedResponse,
    [codes.FORBIDDEN]: ForbiddenResponse,
  },
})

export const remove = createRoute({
  path: '/{id}',
  method: 'delete',
  middleware,
  security: [{ bearerAuth: [] }],
  summary: 'Revoke an invite code',
  description: 'Invalida um código de convite (soft: define expiresAt para agora).',
  tags,
  request: { params: z.object({ id: IdSchema }) },
  responses: {
    [codes.NO_CONTENT]: { description: 'Convite revogado com sucesso.' },
    [codes.NOT_FOUND]: jsonContent(
      createMessageObjectSchema('Convite não encontrado'),
      'Nenhum convite foi localizado com o ID informado.',
    ),
    [codes.UNAUTHORIZED]: UnauthorizedResponse,
    [codes.FORBIDDEN]: ForbiddenResponse,
  },
})
