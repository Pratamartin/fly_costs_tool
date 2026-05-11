import { createRouter } from '@/lib/util'
import * as handlers from './invites.handler'
import * as routes from './invites.route'

const router = createRouter().basePath('/invites')
  .openapi(routes.index, handlers.index)
  .openapi(routes.create, handlers.create)
  .openapi(routes.remove, handlers.remove)

export default router
