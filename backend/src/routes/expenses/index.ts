import { createRouter } from '@/lib/util'
import * as handlers from './expenses.handler'
import * as routes from './expenses.route'

const router = createRouter().basePath('/expenses')
  .openapi(routes.create, handlers.create)

export default router
