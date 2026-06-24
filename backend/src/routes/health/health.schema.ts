import { z } from '@hono/zod-openapi'

export const HealthResponseSchema = z.object({
  status: z.string().openapi({ example: 'OK' }),
  uptime: z.number().openapi({
    example: 1234.56,
    description: 'Server uptime in seconds',
  }),
  timestamp: z.date()
    .openapi({ example: new Date().toISOString() }),
}).openapi('HealthResponse')
