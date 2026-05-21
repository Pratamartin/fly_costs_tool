import type { GetNotificationsRoute, MarkAllReadRoute, MarkReadRoute } from './notifications.route'
import type { AppRouteHandler } from '@/lib/type'
import * as codes from 'stoker/http-status-codes'
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

  try {
    await service.markAsRead(id, jwt.sub)
    return c.json({ message: 'Notificação marcada como lida' }, codes.OK)
  }
  catch {
    return c.json({ message: 'Notificação não encontrada' }, codes.NOT_FOUND)
  }
}

export const markAllRead: AppRouteHandler<MarkAllReadRoute> = async (c) => {
  const jwt = c.get('jwtPayload')

  await service.markAllAsRead(jwt.sub)
  return c.json({ message: 'Todas as notificações foram marcadas como lidas' }, codes.OK)
}
