import { createRoute, z } from '@hono/zod-openapi'
import * as codes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { ALLOWED_RECEIPT_MIME_TYPES, COST_BREAKDOWN_RECEIPT_DOWNLOAD_URL_EXPIRY_SECONDS, RECEIPT_UPLOAD_MAX_SIZE_MB } from '@/constants/file.constant'
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
  operationId: 'createCostBreakdown',
  summary: 'Add cost breakdown to expense',
  description: 'Allocates project funds to an expense in `EM_PROCESSAMENTO`. Validates budget availability (`PROJECT_INSUFFICIENT_FUNDS`), temporal vigency (`PROJECT_PERIOD_EXPIRED`), and that the project is active (`PROJECT_ARCHIVED`). Budget is **not** debited until conclusion. `ADMIN` only.',
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
    ...registryResponses('BAD_REQUEST', 'PROJECT_ARCHIVED', 'EXPENSE_NOT_FOUND', 'PROJECT_NOT_FOUND', 'PROJECT_INSUFFICIENT_FUNDS', 'INVALID_SUBCATEGORIES', 'INVALID_EXPENSE_STATE', 'PROJECT_PERIOD_EXPIRED'),
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
  operationId: 'uploadCostBreakdownReceipt',
  summary: 'Upload receipt to cost breakdown',
  description: `Uploads a receipt file for an existing cost breakdown. Allowed formats: **${ALLOWED_RECEIPT_MIME_TYPES.join(', ')}**. Max size: **${RECEIPT_UPLOAD_MAX_SIZE_MB}MB**. \`ADMIN\` only.`,
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
  operationId: 'deleteCostBreakdownReceipt',
  summary: 'Delete receipt from cost breakdown',
  description: 'Removes the receipt from the database record and R2 storage. `ADMIN` only.',
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
  operationId: 'getReceiptDownloadUrl',
  summary: 'Get receipt download URL',
  description: `Returns a signed R2 URL to download a cost breakdown receipt. Valid for **${COST_BREAKDOWN_RECEIPT_DOWNLOAD_URL_EXPIRY_SECONDS}s**. Accessible by \`ADMIN\` or expense owner.`,
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
