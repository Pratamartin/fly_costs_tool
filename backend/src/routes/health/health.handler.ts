import type { z } from '@hono/zod-openapi'
import type { IndexRoute } from './health.route'
import type { HealthResponseSchema } from './health.schema'
import type { AppRouteHandler } from '@/lib/type'
import * as codes from 'stoker/http-status-codes'
import * as phrases from 'stoker/http-status-phrases'

export const index: AppRouteHandler<IndexRoute> = (c) => {
  const logger = c.get('logger')
  const jwt = c.get('jwtPayload')

  logger.info(jwt.role)

  const response: z.infer<typeof HealthResponseSchema> = {
    status: phrases.OK,
    timestamp: new Date(),
    uptime: process.uptime(),
  }
  logger.info('Server healthy')
  return c.json(response, codes.OK)
}
