import { createRoute, z } from '@hono/zod-openapi'
import * as codes from 'stoker/http-status-codes'
import { jsonContent } from 'stoker/openapi/helpers'
import { createMessageObjectSchema } from 'stoker/openapi/schemas'
import { requireAuth } from '@/middlewares'
import { NotificationQuerySchema, NotificationsListSchema } from '@/schemas/notification.schema'
import { UnauthorizedResponse } from '@/schemas/shared.schema'

const tags = ['Notifications']

export const getNotifications = createRoute({
  path: '/',
  method: 'get',
  summary: 'Get user notifications',
  description: 'Retorna as notificações do usuário autenticado com suporte a paginação e filtro de lidas.',
  tags,
  middleware: [requireAuth],
  security: [{ Bearer: [] }],
  request: { query: NotificationQuerySchema },
  responses: {
    [codes.OK]: jsonContent(
      NotificationsListSchema,
      'Lista de notificações retornada com sucesso.',
    ),
    [codes.UNAUTHORIZED]: UnauthorizedResponse,
  },
})

export const markRead = createRoute({
  path: '/{id}/read',
  method: 'patch',
  summary: 'Mark notification as read',
  description: 'Marca uma notificação específica como lida.',
  tags,
  middleware: [requireAuth],
  security: [{ Bearer: [] }],
  request: {
    params: z.object({
      id: z.string().uuid()
        .openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),

    }),
  },
  responses: {
    [codes.OK]: jsonContent(
      createMessageObjectSchema('Notificação marcada como lida'),
      'Notificação atualizada com sucesso.',
    ),
    [codes.UNAUTHORIZED]: UnauthorizedResponse,
    [codes.NOT_FOUND]: jsonContent(
      createMessageObjectSchema('Notificação não encontrada'),
      'A notificação informada não existe ou não pertence ao usuário.',
    ),
  },
})

export const markAllRead = createRoute({
  path: '/read-all',
  method: 'patch',
  summary: 'Mark all notifications as read',
  description: 'Marca todas as notificações do usuário como lidas.',
  tags,
  middleware: [requireAuth],
  security: [{ Bearer: [] }],
  responses: {
    [codes.OK]: jsonContent(
      createMessageObjectSchema('Todas as notificações foram marcadas como lidas'),
      'Notificações atualizadas com sucesso.',
    ),
    [codes.UNAUTHORIZED]: UnauthorizedResponse,
  },
})

export type GetNotificationsRoute = typeof getNotifications
export type MarkReadRoute = typeof markRead
export type MarkAllReadRoute = typeof markAllRead
