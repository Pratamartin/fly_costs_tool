import { createRouter } from '@/lib/util'
import * as handlers from './preference-surveys.handler'
import * as routes from './preference-surveys.route'

const router = createRouter().basePath('/preference-surveys')
  .openapi(routes.listActive, handlers.listActive)
  .openapi(routes.upload, handlers.upload)
  .openapi(routes.download, handlers.download)

export default router
