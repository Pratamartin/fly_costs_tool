import { createRoute, z } from '@hono/zod-openapi'
import * as codes from 'stoker/http-status-codes'
import { jsonContent } from 'stoker/openapi/helpers'
import { sseContent } from '@/lib/util'
import { requireAuth } from '@/middlewares'
import { ExpenseReportQuerySchema } from '@/schemas/expense.schema'
import { ReportEventDataSchema, ReportEventEnumSchema } from '@/schemas/report.schema'
import { IdSchema, UnauthorizedResponse } from '@/schemas/shared.schema'

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
  description: 'Inicia a geração assíncrona do relatório PDF e retorna um jobId.',
  request: { query: ExpenseReportQuerySchema },
  responses: {
    [codes.ACCEPTED]: jsonContent(
      z.object({ jobId: z.string().uuid() }),
      'Geração de relatório iniciada.',
    ),
    [codes.UNAUTHORIZED]: UnauthorizedResponse,
  },
})

export const reportStatus = createRoute({
  path: '/status/{jobId}',
  method: 'get',
  tags,
  middleware: [requireAuth],
  security: [{ bearerAuth: [] }],
  summary: 'Monitor report generation status (SSE)',
  description: 'Acompanha o progresso da geração via Server-Sent Events. Envia eventos nomeados como `report-update`, `report-finished` e `report-error`.',
  request: { params: z.object({ jobId: IdSchema }) },
  responses: {
    [codes.OK]: sseContent(
      ReportEventDataSchema,
      'Stream de eventos SSE. Utilize addEventListener para capturar os eventos específicos.',
      ReportEventEnumSchema,
    ),
    [codes.UNAUTHORIZED]: UnauthorizedResponse,
  },
})
