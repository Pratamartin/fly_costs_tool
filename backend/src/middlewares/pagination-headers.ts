import type { AppContext } from '@/lib/type'
import { createMiddleware } from 'hono/factory'

const paginationHeaders = createMiddleware<AppContext>(async (c, next) => {
  await next()

  const meta = c.get('paginationMeta')
  if (meta) {
    c.header('x-total-count', meta.total.toString())
    c.header('x-pagination-limit', meta.limit.toString())
    c.header('x-pagination-offset', meta.offset.toString())
  }
})

export default paginationHeaders
