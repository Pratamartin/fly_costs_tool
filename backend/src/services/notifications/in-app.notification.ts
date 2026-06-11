import type { z } from '@hono/zod-openapi'
import type { Prisma } from '@/generated/prisma/client'
import type { ServiceResult } from '@/lib/problems'
import type { NotificationQuerySchema } from '@/schemas/notification.schema'
import prisma from '@/lib/orm'

export async function createInAppNotification(data: {
  userId: string
  expenseRequestId: string
}, tx: Prisma.TransactionClient = prisma) {
  return tx.notification.create({
    data: {
      userId: data.userId,
      expenseRequestId: data.expenseRequestId,
    },
  })
}

export async function createManyInAppNotifications(
  data: { userIds: string[], expenseRequestId: string },
  tx: Prisma.TransactionClient = prisma,
) {
  const notifications = data.userIds.map(userId => ({
    userId,
    expenseRequestId: data.expenseRequestId,
  }))

  return tx.notification.createMany({ data: notifications })
}

export async function getUserNotifications(
  userId: string,
  filters: z.infer<typeof NotificationQuerySchema> = {},
) {
  const { limit = 20, offset = 0, unreadOnly } = filters

  return prisma.notification.findMany({
    where: {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
    include: {
      expenseRequest: {
        select: {
          id: true,
          title: true,
          status: true,
          updatedAt: true,
        },
      },
    },
  })
}

export async function markAsRead(id: string, userId: string): Promise<ServiceResult<{ id: string }, 'NOTIFICATION_NOT_FOUND'>> {
  try {
    return await prisma.notification.update({
      where: {
        id,
        userId,
      },
      data: { isRead: true },
      select: { id: true },
    })
  }
  catch {
    return { error: 'NOTIFICATION_NOT_FOUND' }
  }
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: { isRead: true },
  })
}
