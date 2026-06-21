import { createRoute, z } from '@hono/zod-openapi'
import * as codes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { UserRole } from '@/generated/prisma/enums'
import { registryResponses, standardResponses } from '@/lib/problems'
import { multipartFormContentRequired } from '@/lib/util'
import { requireAuth, requireRole } from '@/middlewares'
import { uploadReceiptSettings } from '@/middlewares/upload-settings'
import { CostBreakdownResponseSchema, CreateCostBreakdownSchema, ReceiptDownloadUrlSchema, UploadReceiptSchema } from '@/schemas/cost-breakdown.schema'
import { IdSchema } from '@/schemas/shared.schema'

const tags = ['Cost Breakdowns']

export type CreateRoute = typeof create
export type UploadReceiptRoute = typeof uploadReceipt
export type RemoveReceiptRoute = typeof removeReceipt
export type GetReceiptDownloadRoute = typeof getReceiptDownload

export const create = createRoute({
  path: '/',
  method: 'post',
  middleware: [requireAuth, requireRole([UserRole.ADMIN])],
  security: [{ bearerAuth: [] }],
  summary: 'Add cost breakdown to expense',
  description: 'Adds a cost breakdown to an expense request. Restricted to ADMIN.',
  tags,
  request: {
    params: z.object({ id: IdSchema }),
    body: jsonContentRequired(CreateCostBreakdownSchema, 'Cost breakdown details'),
  },
  responses: {
    [codes.CREATED]: jsonContent(
      CostBreakdownResponseSchema,
      'Breakdown saved successfully.',
    ),
    ...standardResponses,
    ...registryResponses('BAD_REQUEST', 'PROJECT_ARCHIVED', 'EXPENSE_NOT_FOUND', 'PROJECT_NOT_FOUND', 'PROJECT_INSUFFICIENT_FUNDS', 'INVALID_SUBCATEGORIES', 'INVALID_EXPENSE_STATE'),
  },
})

export const uploadReceipt = createRoute({
  path: '/{breakdownId}/receipt',
  method: 'post',
  middleware: [
    requireAuth,
    requireRole([UserRole.ADMIN]),
    uploadReceiptSettings.size,
    uploadReceiptSettings.content,
  ],
  security: [{ bearerAuth: [] }],
  summary: 'Upload receipt to cost breakdown',
  description: 'Uploads a receipt file for an existing cost breakdown.',
  tags,
  request: {
    params: z.object({
      id: IdSchema,
      breakdownId: IdSchema,
    }),
    body: multipartFormContentRequired(UploadReceiptSchema, 'Receipt file (PDF, Image)'),
  },
  responses: {
    [codes.OK]: jsonContent(
      CostBreakdownResponseSchema,
      'Receipt attached successfully.',
    ),
    ...standardResponses,
    ...registryResponses('INVALID_FILE', 'FILE_TOO_LARGE', 'UNSUPPORTED_MEDIA_TYPE', 'EXPENSE_NOT_FOUND', 'COST_BREAKDOWN_NOT_FOUND', 'STORAGE_UNAVAILABLE', 'STORAGE_PROVIDER_ERROR'),
  },
})

export const removeReceipt = createRoute({
  path: '/{breakdownId}/receipt',
  method: 'delete',
  middleware: [requireAuth, requireRole([UserRole.ADMIN])],
  security: [{ bearerAuth: [] }],
  summary: 'Delete receipt from cost breakdown',
  description: 'Removes the receipt from the database and R2 storage. Restricted to ADMIN.',
  tags,
  request: {
    params: z.object({
      id: IdSchema,
      breakdownId: IdSchema,
    }),
  },
  responses: {
    [codes.NO_CONTENT]: { description: 'Receipt removed successfully.' },
    ...registryResponses('EXPENSE_NOT_FOUND', 'COST_BREAKDOWN_NOT_FOUND', 'RECEIPT_NOT_FOUND', 'STORAGE_PROVIDER_ERROR', 'UNAUTHORIZED', 'FORBIDDEN'),
  },
})

export const getReceiptDownload = createRoute({
  path: '/{breakdownId}/receipt/download',
  method: 'get',
  middleware: [requireAuth],
  security: [{ bearerAuth: [] }],
  summary: 'Signed URL for receipt download',
  description: 'Returns a pre-signed URL valid for 15 min to download a cost breakdown receipt. Access: ADMIN or expense owner.',
  tags,
  request: {
    params: z.object({
      id: IdSchema,
      breakdownId: IdSchema,
    }),
  },
  responses: {
    [codes.OK]: jsonContent(
      ReceiptDownloadUrlSchema,
      'URL generated successfully.',
    ),
    ...registryResponses('EXPENSE_NOT_FOUND', 'COST_BREAKDOWN_NOT_FOUND', 'RECEIPT_NOT_FOUND', 'STORAGE_UNAVAILABLE', 'STORAGE_PROVIDER_ERROR', 'FORBIDDEN'),
  },
})
