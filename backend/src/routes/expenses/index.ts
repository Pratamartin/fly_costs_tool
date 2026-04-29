import { createRouter } from '@/lib/util'
import categories from './categories'
import * as handlers from './expenses.handler'
import * as routes from './expenses.route'

const router = createRouter().basePath('/expenses')
  .route('/', categories)
  .openapi(routes.index, handlers.index)
  .openapi(routes.create, handlers.create)
  .openapi(routes.read, handlers.read)
  .openapi(routes.updateStatus, handlers.updateStatus)

export default router
