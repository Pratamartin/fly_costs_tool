import type { ConcludeRoute, CreateRoute, GetMemorandumDownloadRoute, IndexRoute, ReadRoute, RemoveRoute, StartProcessingRoute, UpdateRoute, UpdateStatusRoute, UploadMemorandumRoute } from './expenses.route'
import type { AppRouteHandler } from '@/lib/type'
import * as codes from 'stoker/http-status-codes'
import { problems } from '@/lib/problems'
import { AssignProjectResponseSchema, CreateExpenseResponseSchema, ExpenseResponseSchema, ListExpenseResponseSchema } from '@/schemas/expense.schema'
import { DeleteExpenseResponseSchema } from '@/schemas/shared.schema'
import { attachMemorandumToExpense, concludeExpenseRequest, createExpenseRequest, deleteExpenseRequest, getAllExpenseRequests, getExpenseById, getMemorandumDownloadUrl, startExpenseProcessing, updateExpense, updateExpenseStatus } from '@/services/expense.service'

export const index: AppRouteHandler<IndexRoute> = async (c) => {
  const { sub, role } = c.get('jwtPayload')
  const query = c.req.valid('query')

  const result = await getAllExpenseRequests(sub, role, query)

  if ('error' in result) {
    throw problems.create(result.error, { extensions: result.context })
  }

  const parsed = ListExpenseResponseSchema.parse(result)

  return c.json(parsed, codes.OK)
}

export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const data = c.req.valid('json')

  const { sub } = c.get('jwtPayload')

  const result = await createExpenseRequest(sub, data)

  if ('error' in result) {
    throw problems.create(result.error, { extensions: result.context })
  }

  const parsed = CreateExpenseResponseSchema.parse(result)

  return c.json(parsed, codes.CREATED)
}

export const read: AppRouteHandler<ReadRoute> = async (c) => {
  const { sub, role } = c.get('jwtPayload')
  const { id } = c.req.valid('param')

  const result = await getExpenseById(id, sub, role)

  if ('error' in result) {
    throw problems.create(result.error, { extensions: result.context })
  }

  const data = result

  const payload = {
    ...data,
    costBreakdowns: data.costBreakdowns?.map(cb => ({
      ...cb,
      subcategory: cb.expenseCategory,
    })),
  }

  const parsed = ExpenseResponseSchema.parse(payload)
  return c.json(parsed, codes.OK)
}

export const updateStatus: AppRouteHandler<UpdateStatusRoute> = async (c) => {
  const { id } = c.req.valid('param')
  const { status, reason } = c.req.valid('json')
  const { role } = c.get('jwtPayload')

  const result = await updateExpenseStatus(id, status, role, reason)

  if ('error' in result) {
    throw problems.create(result.error, { extensions: result.context })
  }

  const payload = {
    ...result,
    costBreakdowns: result.costBreakdowns?.map(cb => ({
      ...cb,
      subcategory: cb.expenseCategory,
    })),
  }

  const parsed = ExpenseResponseSchema.parse(payload)
  return c.json(parsed, codes.OK)
}

export const update: AppRouteHandler<UpdateRoute> = async (c) => {
  const { id } = c.req.valid('param')
  const data = c.req.valid('json')
  const { sub } = c.get('jwtPayload')

  const result = await updateExpense(id, sub, data)

  if ('error' in result) {
    throw problems.create(result.error, { extensions: result.context })
  }

  const payload = {
    ...result,
    costBreakdowns: result.costBreakdowns?.map(cb => ({
      ...cb,
      subcategory: cb.expenseCategory,
    })),
  }

  const parsed = ExpenseResponseSchema.parse(payload)
  return c.json(parsed, codes.OK)
}

export const startProcessing: AppRouteHandler<StartProcessingRoute> = async (c) => {
  const { id } = c.req.valid('param')

  const result = await startExpenseProcessing(id)

  if ('error' in result) {
    throw problems.create(result.error, { extensions: result.context })
  }
  const parsed = AssignProjectResponseSchema.parse(result)
  return c.json(parsed, codes.OK)
}

export const uploadMemorandum: AppRouteHandler<UploadMemorandumRoute> = async (c) => {
  const { id } = c.req.valid('param')
  const { sub } = c.get('jwtPayload')
  const form = c.req.valid('form')

  const result = await attachMemorandumToExpense(id, sub, form.file)

  if ('error' in result) {
    throw problems.create(result.error, { extensions: result.context })
  }

  const parsed = ExpenseResponseSchema.parse(result)
  return c.json(parsed, codes.OK)
}

export const getMemorandumDownload: AppRouteHandler<GetMemorandumDownloadRoute> = async (c) => {
  const { sub, role } = c.get('jwtPayload')
  const { id } = c.req.valid('param')

  const result = await getMemorandumDownloadUrl(id, sub, role)

  if ('error' in result) {
    throw problems.create(result.error, { extensions: result.context })
  }

  return c.json({
    downloadUrl: result.url,
    expiresIn: result.expiresIn,
  }, codes.OK)
}

export const conclude: AppRouteHandler<ConcludeRoute> = async (c) => {
  const { id } = c.req.valid('param')
  const { role } = c.get('jwtPayload')

  const result = await concludeExpenseRequest(id, role)

  if ('error' in result) {
    throw problems.create(result.error, { extensions: result.context })
  }

  const payload = {
    ...result,
    costBreakdowns: result.costBreakdowns?.map(cb => ({
      ...cb,
      subcategory: cb.expenseCategory,
    })),
  }

  const parsed = ExpenseResponseSchema.parse(payload)
  return c.json(parsed, codes.OK)
}

export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
  const { id } = c.req.valid('param')
  const { sub, role } = c.get('jwtPayload')

  const result = await deleteExpenseRequest(id, sub, role)

  if ('error' in result) {
    throw problems.create(result.error, { extensions: result.context })
  }

  const parsed = DeleteExpenseResponseSchema.parse(result)
  return c.json(parsed, codes.OK)
}
