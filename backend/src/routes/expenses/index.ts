import { createRouter } from '@/lib/util'
import * as handlers from './expenses.handler'
import * as routes from './expenses.route'

const router = createRouter().basePath('/expenses')
  .openapi(routes.index, handlers.index)
  .openapi(routes.create, handlers.create)
  .openapi(routes.read, handlers.read)

export default router
