import { createRouter } from '@/lib/util'
import * as handlers from './auth.handler'
import * as routes from './auth.route'

const router = createRouter().basePath('/auth')
  .openapi(routes.register, handlers.register)
  .openapi(routes.login, handlers.login)

export default router
