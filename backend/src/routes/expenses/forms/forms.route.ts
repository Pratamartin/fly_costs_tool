import { createRoute } from '@hono/zod-openapi'
import * as codes from 'stoker/http-status-codes'
import { jsonContent } from 'stoker/openapi/helpers'
import { requireAuth } from '@/middlewares'
import { FormsResponseSchema } from '@/schemas/expense.forms.schema'
import { UnauthorizedResponse } from '@/schemas/shared.schema'

const tags = ['Expenses']

export const index = createRoute({
  path: '/',
  method: 'get',
  middleware: [requireAuth],
  security: [{ bearerAuth: [] }],
  summary: 'Get expense forms (schemas + ui)',
  description: 'Retorna os JSON Schemas e UI Schemas para Evento e Artigo.',
  tags,
  responses: {
    [codes.OK]: jsonContent(FormsResponseSchema, 'Formulários base.'),
    [codes.UNAUTHORIZED]: UnauthorizedResponse,
  },
})

export type IndexRoute = typeof index
