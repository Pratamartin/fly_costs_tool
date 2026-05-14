import { createRouter } from '@/lib/util'
import categories from './categories'
import costBreakdowns from './cost-breakdowns'
import * as handlers from './expenses.handler'
import * as routes from './expenses.route'

const router = createRouter().basePath('/expenses')
  .route('/', categories)
  .route('/', costBreakdowns)
  .openapi(routes.index, handlers.index)
  .openapi(routes.create, handlers.create)
  .openapi(routes.read, handlers.read)
  .openapi(routes.update, handlers.update)
  .openapi(routes.uploadMemorandum, handlers.uploadMemorandum)
  .openapi(routes.getMemorandumDownload, handlers.getMemorandumDownload)
  .openapi(routes.updateStatus, handlers.updateStatus)
  .openapi(routes.assignProject, handlers.assignProject)
  .openapi(routes.conclude, handlers.conclude)

export default router
