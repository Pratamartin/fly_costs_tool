import { createRouter } from '@/lib/util'
import * as handlers from './categories.handler'
import * as routes from './categories.route'

const router = createRouter().basePath('/categories')
  .openapi(routes.index, handlers.index)

export default router
