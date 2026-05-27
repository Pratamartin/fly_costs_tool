import { createRouter } from '@/lib/util'
import * as handlers from './forms.handler'
import * as routes from './forms.route'

const router = createRouter().basePath('/forms')
  .openapi(routes.index, handlers.index)

export default router
