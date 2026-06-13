import { createRoute } from '@hono/zod-openapi'
import * as codes from 'stoker/http-status-codes'
import { jsonContent } from 'stoker/openapi/helpers'
import { HealthResponseSchema } from './health.schema'

const tags = ['Health']
export type IndexRoute = typeof index

export const index = createRoute({
  path: '/',
  method: 'get',
  summary: 'Health check',
  description: 'Checks the operational status of the API and its dependent services.',
  tags,
  responses: {
    [codes.OK]: jsonContent(
      HealthResponseSchema,
      'The API is online and responding.',
    ),
  },
})
