import type { IndexRoute } from './categories.route'
import type { AppRouteHandler } from '@/lib/type'
import * as codes from 'stoker/http-status-codes'
import { ListExpenseCategoryResponseSchema } from '@/schemas/expense.category.schema'
import { getAllExpenseCategories } from '@/services/expense.category.service'

export const index: AppRouteHandler<IndexRoute> = async (c) => {
  const query = c.req.valid('query')

  const data = await getAllExpenseCategories(query)

  const parsed = ListExpenseCategoryResponseSchema.parse(data)

  return c.json(parsed, codes.OK)
}
