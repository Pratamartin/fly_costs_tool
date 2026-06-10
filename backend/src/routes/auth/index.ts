import { createRouter } from '@/lib/util'
import * as handlers from './auth.handler'
import * as routes from './auth.route'

const router = createRouter().basePath('/auth')
  .openapi(routes.register, handlers.register)
  .openapi(routes.login, handlers.login)
  .openapi(routes.refresh, handlers.refresh)
  .openapi(routes.logout, handlers.logout)
  .openapi(routes.forgotPassword, handlers.forgotPassword)
  .openapi(routes.resetPassword, handlers.resetPassword)

export default router
