import { createRoute } from '@hono/zod-openapi'
import * as codes from 'stoker/http-status-codes'
import { jsonContent } from 'stoker/openapi/helpers'
import { requireAuth, requireRole } from '@/middlewares'
import { HealthResponseSchema } from './health.schema'

const tags = ['Health']
export type IndexRoute = typeof index

export const index = createRoute({
  path: '/',
  method: 'get',
  middleware: [requireAuth, requireRole(['ADMIN'])],
  security: [{ bearerAuth: [] }],
  summary: 'Health check',
  description: 'Verifica o status operacional da API e seus serviços dependentes.',
  tags,
  responses: {
    [codes.OK]: jsonContent(
      HealthResponseSchema,
      'A API está online e respondendo.',
    ),
  },
})
