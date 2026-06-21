import type { CreateRoute, GetReceiptDownloadRoute, RemoveReceiptRoute, UploadReceiptRoute } from './cost-breakdowns.route'
import type { AppRouteHandler } from '@/lib/type'
import * as codes from 'stoker/http-status-codes'
import { problems } from '@/lib/problems'
import { CostBreakdownResponseSchema, ReceiptDownloadUrlSchema } from '@/schemas/cost-breakdown.schema'
import { createCostBreakdown, deleteCostBreakdownReceipt, getCostBreakdownReceiptUrl, uploadCostBreakdownReceipt } from '@/services/budget.service'

export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const { id } = c.req.valid('param')
  const data = c.req.valid('json')

  const result = await createCostBreakdown(id, data)

  if (result && 'error' in result) {
    throw problems.create(result.error, { extensions: result.context })
  }

  const parsed = CostBreakdownResponseSchema.parse({
    ...result,
    subcategory: result.expenseCategory,
  })
  return c.json(parsed, codes.CREATED)
}

export const uploadReceipt: AppRouteHandler<UploadReceiptRoute> = async (c) => {
  const { id, breakdownId } = c.req.valid('param')
  const { file } = c.req.valid('form')

  const result = await uploadCostBreakdownReceipt(id, breakdownId, file)

  if ('error' in result) {
    throw problems.create(result.error)
  }

  const parsed = CostBreakdownResponseSchema.parse({
    ...result,
    subcategory: result.expenseCategory,
  })
  return c.json(parsed, codes.OK)
}

export const removeReceipt: AppRouteHandler<RemoveReceiptRoute> = async (c) => {
  const { id, breakdownId } = c.req.valid('param')

  const result = await deleteCostBreakdownReceipt(id, breakdownId)

  if ('error' in result) {
    throw problems.create(result.error)
  }

  return c.body(null, codes.NO_CONTENT)
}

export const getReceiptDownload: AppRouteHandler<GetReceiptDownloadRoute> = async (c) => {
  const { id, breakdownId } = c.req.valid('param')
  const { sub, role } = c.get('jwtPayload')

  const result = await getCostBreakdownReceiptUrl(id, breakdownId, sub, role)

  if ('error' in result) {
    throw problems.create(result.error)
  }

  const parsed = ReceiptDownloadUrlSchema.parse(result)

  return c.json(parsed, codes.OK)
}
