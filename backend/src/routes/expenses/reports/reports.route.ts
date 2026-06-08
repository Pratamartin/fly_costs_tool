import { createRoute, z } from '@hono/zod-openapi'
import * as codes from 'stoker/http-status-codes'
import { jsonContent } from 'stoker/openapi/helpers'
import { registryResponses } from '@/lib/problems'
import { sseContent } from '@/lib/util'
import { requireAuth } from '@/middlewares'
import { ExpenseReportQuerySchema } from '@/schemas/expense.schema'
import { ReportEventDataSchema, ReportEventEnumSchema } from '@/schemas/report.schema'
import { IdSchema } from '@/schemas/shared.schema'

const tags = ['Expenses - Reports']

export type RequestReportRoute = typeof requestReport
export type ReportStatusRoute = typeof reportStatus

export const requestReport = createRoute({
  path: '/',
  method: 'get',
  tags,
  middleware: [requireAuth],
  security: [{ bearerAuth: [] }],
  summary: 'Request expense report generation',
  description: 'Starts asynchronous PDF report generation and returns a jobId.',
  request: { query: ExpenseReportQuerySchema },
  responses: {
    [codes.ACCEPTED]: jsonContent(
      z.object({ jobId: z.string().uuid() }),
      'Report generation started.',
    ),
    ...registryResponses('UNAUTHORIZED', 'VALIDATION_ERROR'),
  },
})

export const reportStatus = createRoute({
  path: '/status/{jobId}',
  method: 'get',
  tags,
  middleware: [requireAuth],
  security: [{ bearerAuth: [] }],
  summary: 'Monitor report generation status (SSE)',
  description: 'Monitors generation progress via Server-Sent Events. Sends events named `report-update`, `report-finished`, and `report-error`.',
  request: { params: z.object({ jobId: IdSchema }) },
  responses: {
    [codes.OK]: sseContent(
      ReportEventDataSchema,
      'SSE event stream. Use addEventListener to capture specific events.',
      ReportEventEnumSchema,
    ),
    ...registryResponses('UNAUTHORIZED'),
  },
})
