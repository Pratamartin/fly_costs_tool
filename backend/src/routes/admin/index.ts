import { createRouter } from '@/lib/util'
import invites from './invites'

const router = createRouter().basePath('/admin')
  .route('/', invites)

export default router
