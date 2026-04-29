import { createRoute } from '@hono/zod-openapi'
import * as codes from 'stoker/http-status-codes'
import { jsonContent } from 'stoker/openapi/helpers'
import { ListExpenseCategoryQuerySchema, ListExpenseCategoryResponseSchema } from '@/schemas/expense.category.schema'

export type IndexRoute = typeof index

export const index = createRoute({
  path: '/',
  method: 'get',
  summary: 'List expense categories',
  tags: ['Expense Categories'],
  request: { query: ListExpenseCategoryQuerySchema },
  responses: {
    [codes.OK]: jsonContent(
      ListExpenseCategoryResponseSchema,
      'Lista de categorias retornada com sucesso',
    ),
  },
})
