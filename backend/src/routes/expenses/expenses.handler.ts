import type { CreateRoute, IndexRoute, ReadRoute } from './expenses.route'
import type { AppRouteHandler } from '@/lib/type'
import * as codes from 'stoker/http-status-codes'
import { CreateExpenseSuccessSchema, ListExpenseSuccessSchema } from '@/schemas/expense.schema'
import { createExpenseRequest, getAllExpenseRequests, getExpenseById } from '@/services/expense.service'

export const index: AppRouteHandler<IndexRoute> = async (c) => {
  const { sub, role } = c.get('jwtPayload')
  const query = c.req.valid('query')

  const data = await getAllExpenseRequests(sub, role, query)

  const parsed = ListExpenseSuccessSchema.parse(data)

  return c.json(parsed, codes.OK)
}

export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const data = c.req.valid('json')

  const { sub } = c.get('jwtPayload')

  const result = await createExpenseRequest(sub, data)

  return c.json(result, codes.CREATED)
}

export const read: AppRouteHandler<ReadRoute> = async (c) => {
  const { sub, role } = c.get('jwtPayload')
  const { id } = c.req.valid('param')

  const data = await getExpenseById(id, sub, role)

  if (!data) {
    return c.json({ message: 'Despesa não encontrada' }, codes.NOT_FOUND)
  }

  const parsed = CreateExpenseSuccessSchema.parse(data)
  return c.json(parsed, codes.OK)
}
