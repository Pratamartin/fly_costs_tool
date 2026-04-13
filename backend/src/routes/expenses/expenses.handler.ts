import type { CreateRoute } from './expenses.route'
import type { AppRouteHandler } from '@/lib/type'
import * as codes from 'stoker/http-status-codes'
import { createExpenseRequest } from '@/services/expense.service'

export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const data = c.req.valid('json')

  const { sub } = c.get('jwtPayload')

  const result = await createExpenseRequest(sub, data)

  return c.json(result, codes.CREATED)
}
