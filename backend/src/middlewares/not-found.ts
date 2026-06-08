import type { NotFoundHandler } from 'hono'
import { problems } from '@/lib/problems'

const notFound: NotFoundHandler = (c) => {
  throw problems.create('ROUTE_NOT_FOUND', { detail: `The route '${c.req.path}' was not found.` })
}

export default notFound
