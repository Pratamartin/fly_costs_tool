import { createRouter } from '@/lib/util'
import * as handlers from './notifications.handler'
import * as routes from './notifications.route'

const router = createRouter()
  .openapi(routes.getNotifications, handlers.getNotifications)
  .openapi(routes.markRead, handlers.markRead)
  .openapi(routes.markAllRead, handlers.markAllRead)

export default router
