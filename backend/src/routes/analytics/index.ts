import { createRouter } from '@/lib/util'
import * as handlers from './analytics.handler'
import * as routes from './analytics.route'

const router = createRouter().basePath('/analytics')
  .openapi(routes.adminDashboard, handlers.adminDashboard)
  .openapi(routes.topProjects, handlers.topProjects)

export default router
