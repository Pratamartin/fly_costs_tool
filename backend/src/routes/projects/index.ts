import { createRouter } from '@/lib/util'
import * as handlers from './projects.handler'
import * as routes from './projects.route'

const router = createRouter().basePath('/projects')
  .openapi(routes.index, handlers.index)
  .openapi(routes.create, handlers.create)
  .openapi(routes.read, handlers.read)
  .openapi(routes.update, handlers.update)
  .openapi(routes.updatePeriod, handlers.updatePeriod)
  .openapi(routes.remove, handlers.remove)
  .openapi(routes.listCostBreakdowns, handlers.listCostBreakdowns)

export default router
