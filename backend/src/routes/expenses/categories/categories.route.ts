import { createRoute } from '@hono/zod-openapi'
import * as codes from 'stoker/http-status-codes'
import { jsonContent } from 'stoker/openapi/helpers'
import { registryResponses } from '@/lib/problems'
import { ListExpenseCategoryQuerySchema, ListExpenseCategoryResponseSchema } from '@/schemas/expense.category.schema'

export type IndexRoute = typeof index

export const index = createRoute({
  path: '/',
  method: 'get',
  operationId: 'listExpenseCategories',
  summary: 'List expense categories',
  description: 'Returns available expense categories. Public endpoint (no authentication required).',
  tags: ['Expense Categories'],
  request: { query: ListExpenseCategoryQuerySchema },
  responses: {
    [codes.OK]: jsonContent(
      ListExpenseCategoryResponseSchema,
      'List of categories retrieved successfully.',
    ),
    ...registryResponses('VALIDATION_ERROR'),
  },
})
