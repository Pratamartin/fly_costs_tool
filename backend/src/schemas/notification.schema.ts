import { z } from '@hono/zod-openapi'
import { ExpenseRequestStatus } from '@/generated/prisma/enums'
import { IdSchema, PaginationSchema } from './shared.schema'

export const NotificationSchema = z.object({
  id: IdSchema,
  userId: IdSchema
    .nullable()
    .openapi({ description: 'ID of the user receiving the notification' }),
  expenseRequestId: IdSchema
    .nullable()
    .openapi({ description: 'ID of the related expense request, if any' }),
  isRead: z.boolean().openapi({
    example: false,
    description: 'Whether the notification has been read',
  }),
  createdAt: z.coerce.date().openapi({ description: 'Date and time the notification was created' }),
  expenseRequest: z.object({
    id: IdSchema,
    title: z.string().openapi({
      example: 'Inscrição - SBSC 2026',
      description: 'Title of the related expense request',
    }),
    status: z.enum(ExpenseRequestStatus).openapi({
      example: ExpenseRequestStatus.PENDENTE,
      description: 'Current status of the expense request',
    }),
    updatedAt: z.coerce.date().openapi({ description: 'Last update time of the expense request' }),
  }).nullable()
    .openapi({ description: 'Snapshot of the related expense request' }),
}).openapi({ description: 'A user notification' })

export const NotificationsListSchema = z.array(NotificationSchema)

export const NotificationQuerySchema = PaginationSchema.extend({
  unreadOnly: z.coerce.boolean()
    .optional()
    .openapi({
      example: false,
      description: 'Filter only by unread notifications',
    }),
}).partial()
