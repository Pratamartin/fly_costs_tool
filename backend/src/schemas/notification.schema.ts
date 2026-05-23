import { z } from '@hono/zod-openapi'
import { ExpenseRequestStatus } from '@/generated/prisma/enums'
import { IdSchema, PaginationSchema } from './shared.schema'

export const NotificationSchema = z.object({
  id: IdSchema,
  userId: IdSchema
    .nullable(),
  expenseRequestId: IdSchema
    .nullable(),
  isRead: z.boolean(),
  createdAt: z.coerce.date(),
  expenseRequest: z.object({
    id: IdSchema,
    title: z.string(),
    status: z.enum(ExpenseRequestStatus),
    updatedAt: z.coerce.date(),
  }).nullable(),
})

export const NotificationsListSchema = z.array(NotificationSchema)

export const NotificationQuerySchema = PaginationSchema.extend({
  unreadOnly: z.coerce.boolean()
    .optional()
    .openapi({
      example: false,
      description: 'Filtrar apenas por notificações não lidas',
    }),
}).partial()
