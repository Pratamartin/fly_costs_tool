import { z } from '@hono/zod-openapi'
import { REPORT_SSE_EVENTS, REPORT_SSE_STATUS } from '@/constants/expense.report.constant'

export const ReportEventEnumSchema = z.enum([
  REPORT_SSE_EVENTS.UPDATE,
  REPORT_SSE_EVENTS.FINISHED,
  REPORT_SSE_EVENTS.ERROR,
])

export const ReportEventDataSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal(REPORT_SSE_STATUS.COMPLETED).openapi({ example: REPORT_SSE_STATUS.COMPLETED }),
    downloadUrl: z.string().url()
      .openapi({ example: 'https://storage.example.com/reports/abc-123.pdf?token=...' }),
  }),
  z.object({
    status: z.literal(REPORT_SSE_STATUS.ERROR).openapi({ example: REPORT_SSE_STATUS.ERROR }),
    message: z.string().openapi({ example: 'Erro inesperado na conexão' }),
  }),
  z.object({
    status: z.literal(REPORT_SSE_STATUS.FAILED).openapi({ example: REPORT_SSE_STATUS.FAILED }),
    message: z.string().optional()
      .openapi({ example: 'Ocorreu um erro interno no processamento' }),
  }),
  z.object({ status: z.literal(REPORT_SSE_STATUS.NOT_FOUND).openapi({ example: REPORT_SSE_STATUS.NOT_FOUND }) }),
  z.object({ status: z.enum(['active', 'created', 'retry', 'waiting', 'cancelled']).openapi({ example: 'active' }) }),
])

export type ReportSSEEvent = z.infer<typeof ReportEventDataSchema>
