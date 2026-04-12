import { createRouter } from '@/lib/util'
import * as handlers from './me.handler'
import * as routes from './me.route'

const router = createRouter().basePath('/me')
  .openapi(routes.index, handlers.index)

export default router
