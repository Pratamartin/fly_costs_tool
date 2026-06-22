import { createRoute, z } from '@hono/zod-openapi'
import * as codes from 'stoker/http-status-codes'
import { jsonContent } from 'stoker/openapi/helpers'
import { createMessageObjectSchema } from 'stoker/openapi/schemas'
import { registryResponses } from '@/lib/problems'
import { requireAuth } from '@/middlewares'
import { NotificationQuerySchema, NotificationsListSchema } from '@/schemas/notification.schema'

const tags = ['Notifications']

export const getNotifications = createRoute({
  path: '/',
  method: 'get',
  operationId: 'listNotifications',
  summary: 'Get user notifications',
  description: 'Returns notifications for the authenticated user with support for cursor-based pagination and read-status filtering.',
  tags,
  middleware: [requireAuth],
  security: [{ bearerAuth: [] }],
  request: { query: NotificationQuerySchema },
  responses: {
    [codes.OK]: jsonContent(
      NotificationsListSchema,
      'List of notifications retrieved successfully.',
    ),
    ...registryResponses('UNAUTHORIZED', 'VALIDATION_ERROR'),
  },
})

export const markRead = createRoute({
  path: '/{id}/read',
  method: 'patch',
  operationId: 'markNotificationRead',
  summary: 'Mark notification as read',
  description: 'Marks a specific notification as read. Returns `NOTIFICATION_NOT_FOUND` if the notification does not exist or belongs to another user.',
  tags,
  middleware: [requireAuth],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid()
        .openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),

    }),
  },
  responses: {
    [codes.OK]: jsonContent(
      createMessageObjectSchema('Notification marked as read'),
      'Notification updated successfully.',
    ),
    ...registryResponses('UNAUTHORIZED', 'NOTIFICATION_NOT_FOUND', 'VALIDATION_ERROR'),
  },
})

export const markAllRead = createRoute({
  path: '/read-all',
  method: 'patch',
  operationId: 'markAllNotificationsRead',
  summary: 'Mark all notifications as read',
  description: 'Batch-marks all unread notifications for the authenticated user as read.',
  tags,
  middleware: [requireAuth],
  security: [{ bearerAuth: [] }],
  responses: {
    [codes.OK]: jsonContent(
      createMessageObjectSchema('All notifications marked as read'),
      'Notifications updated successfully.',
    ),
    ...registryResponses('UNAUTHORIZED'),
  },
})

export type GetNotificationsRoute = typeof getNotifications
export type MarkReadRoute = typeof markRead
export type MarkAllReadRoute = typeof markAllRead
