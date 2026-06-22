import { createRoute } from '@hono/zod-openapi'
import * as codes from 'stoker/http-status-codes'
import { jsonContent } from 'stoker/openapi/helpers'
import { registryResponses } from '@/lib/problems'
import { requireAuth } from '@/middlewares'
import { FormsResponseSchema } from '@/schemas/expense.forms.schema'

const tags = ['Expenses']

export const index = createRoute({
  path: '/',
  method: 'get',
  middleware: [requireAuth],
  security: [{ bearerAuth: [] }],
  operationId: 'getExpenseForms',
  summary: 'Get expense forms (schemas + ui)',
  description: 'Returns the JSON Schema and UI Schema definitions for Event and Article form rendering.',
  tags,
  responses: {
    [codes.OK]: jsonContent(FormsResponseSchema, 'Base forms.'),
    ...registryResponses('UNAUTHORIZED'),
  },
})

export type IndexRoute = typeof index
