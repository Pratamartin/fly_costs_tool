import { createRouter } from '@/lib/util'
import * as handlers from './cost-breakdowns.handler'
import * as routes from './cost-breakdowns.route'

const router = createRouter()
  .basePath('/:id/cost-breakdowns')
  .openapi(routes.create, handlers.create)
  .openapi(routes.update, handlers.update)
  .openapi(routes.uploadReceipt, handlers.uploadReceipt)
  .openapi(routes.removeReceipt, handlers.removeReceipt)
  .openapi(routes.getReceiptDownload, handlers.getReceiptDownload)

export default router
