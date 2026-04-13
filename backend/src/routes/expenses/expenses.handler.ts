import type { CreateRoute, IndexRoute } from './expenses.route'
import type { AppRouteHandler } from '@/lib/type'
import * as codes from 'stoker/http-status-codes'
import { ListExpenseSuccessSchema } from '@/schemas/expense.schema'
import { createExpenseRequest, getAllExpenseRequests } from '@/services/expense.service'

export const index: AppRouteHandler<IndexRoute> = async (c) => {
  const { sub, role } = c.get('jwtPayload')

  const data = await getAllExpenseRequests(sub, role)

  const parsed = ListExpenseSuccessSchema.parse(data)

  return c.json(parsed, codes.OK)
}

export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const data = c.req.valid('json')

  const { sub } = c.get('jwtPayload')

  const result = await createExpenseRequest(sub, data)

  return c.json(result, codes.CREATED)
}
