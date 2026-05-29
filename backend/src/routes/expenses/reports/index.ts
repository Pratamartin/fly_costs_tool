import { createRouter } from '@/lib/util'
import * as handlers from './reports.handler'
import * as routes from './reports.route'

const router = createRouter().basePath('/reports')
  .openapi(routes.requestReport, handlers.requestReport)
  .openapi(routes.reportStatus, handlers.reportStatus)

export default router
