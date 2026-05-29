import type { IndexRoute } from './forms.route'
import type { AppRouteHandler } from '@/lib/type'
import * as codes from 'stoker/http-status-codes'
import { getExpenseForm } from '@/services/expense.form.service'

export const index: AppRouteHandler<IndexRoute> = async (c) => {
  const form = getExpenseForm()
  return c.json(form, codes.OK)
}
