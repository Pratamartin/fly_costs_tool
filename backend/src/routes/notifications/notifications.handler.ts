import type { GetNotificationsRoute, MarkAllReadRoute, MarkReadRoute } from './notifications.route'
import type { AppRouteHandler } from '@/lib/type'
import * as codes from 'stoker/http-status-codes'
import { problems } from '@/lib/problems'
import * as service from '@/services/notifications'

export const getNotifications: AppRouteHandler<GetNotificationsRoute> = async (c) => {
  const jwt = c.get('jwtPayload')
  const query = c.req.valid('query')
  const notifications = await service.getUserNotifications(jwt.sub, query)
  return c.json(notifications, codes.OK)
}

export const markRead: AppRouteHandler<MarkReadRoute> = async (c) => {
  const jwt = c.get('jwtPayload')

  const { id } = c.req.valid('param')

  const result = await service.markAsRead(id, jwt.sub)

  if ('error' in result) {
    throw problems.create(result.error)
  }

  return c.json({ message: 'Notification marked as read' }, codes.OK)
}

export const markAllRead: AppRouteHandler<MarkAllReadRoute> = async (c) => {
  const jwt = c.get('jwtPayload')

  await service.markAllAsRead(jwt.sub)
  return c.json({ message: 'All notifications marked as read' }, codes.OK)
}
