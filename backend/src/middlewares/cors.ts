import { cors } from 'hono/cors'
import env from '@/env'

export default cors({
  origin: env.ALLOWED_ORIGINS,
  allowHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
  allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
  exposeHeaders: ['Content-Length'],
  credentials: true,
})
