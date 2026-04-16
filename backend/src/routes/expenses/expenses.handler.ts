import type { CreateRoute, IndexRoute, ReadRoute, UpdateStatusRoute } from './expenses.route'
import type { AppRouteHandler } from '@/lib/type'
import * as codes from 'stoker/http-status-codes'
import * as phrases from 'stoker/http-status-phrases'
import { ExpenseResponseSchema, ListExpenseResponseSchema } from '@/schemas/expense.schema'
import { createExpenseRequest, getAllExpenseRequests, getExpenseById, updateExpenseStatus } from '@/services/expense.service'

export const index: AppRouteHandler<IndexRoute> = async (c) => {
  const { sub, role } = c.get('jwtPayload')
  const query = c.req.valid('query')

  const data = await getAllExpenseRequests(sub, role, query)

  const parsed = ListExpenseResponseSchema.parse(data)

  return c.json(parsed, codes.OK)
}

export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const data = c.req.valid('json')

  const { sub } = c.get('jwtPayload')

  const result = await createExpenseRequest(sub, data)

  const parsed = ExpenseResponseSchema.parse(result)

  return c.json(parsed, codes.CREATED)
}

export const read: AppRouteHandler<ReadRoute> = async (c) => {
  const { sub, role } = c.get('jwtPayload')
  const { id } = c.req.valid('param')

  const data = await getExpenseById(id, sub, role)

  if (!data) {
    return c.json({ message: 'Despesa não encontrada' }, codes.NOT_FOUND)
  }

  const parsed = ExpenseResponseSchema.parse(data)
  return c.json(parsed, codes.OK)
}

export const updateStatus: AppRouteHandler<UpdateStatusRoute> = async (c) => {
  const { id } = c.req.valid('param')
  const { status } = c.req.valid('json')

  const result = await updateExpenseStatus(id, status)

  if (result?.error === phrases.NOT_FOUND) {
    return c.json({ message: 'Despesa não encontrada' }, codes.NOT_FOUND)
  }

  if (result?.error === phrases.CONFLICT) {
    return c.json({ message: 'Solicitação já foi decidida' }, codes.CONFLICT)
  }

  const parsed = ExpenseResponseSchema.parse(result.data)
  return c.json(parsed, codes.OK)
}
