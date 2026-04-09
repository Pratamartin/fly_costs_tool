import { createRouter } from '@/lib/util'
import * as handlers from './health.handler'
import * as routes from './health.route'

const router = createRouter().basePath('/health')
  .openapi(routes.index, handlers.index)

export default router
