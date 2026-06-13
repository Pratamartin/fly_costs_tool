import type { ReportStatusRoute, RequestReportRoute } from './reports.route'
import type { AppRouteHandler } from '@/lib/type'
import { streamSSE } from 'hono/streaming'
import * as codes from 'stoker/http-status-codes'
import { GENERATE_REPORT_JOB_TYPE, REPORT_SSE_EVENTS, REPORT_SSE_STATUS } from '@/constants/expense.report.constant'
import { UserRole } from '@/generated/prisma/enums'
import { jobManager } from '@/jobs'
import { getSignedDownloadUrl } from '@/lib/storage'
import { ReportEventDataSchema, ReportEventEnumSchema } from '@/schemas/report.schema'

export const requestReport: AppRouteHandler<RequestReportRoute> = async (c) => {
  const { sub, role } = c.get('jwtPayload')
  const query = c.req.valid('query')

  const jobId = await jobManager.boss.send(GENERATE_REPORT_JOB_TYPE, {
    userId: sub,
    role,
    query,
  })

  return c.json({ jobId: jobId! }, codes.ACCEPTED)
}

export const reportStatus: AppRouteHandler<ReportStatusRoute> = async (c) => {
  const { jobId } = c.req.valid('param')
  const { sub, role } = c.get('jwtPayload')

  return streamSSE(c, async (sse) => {
    let completed = false
    sse.onAbort(() => {
      completed = true
    })

    while (!completed) {
      const job = await jobManager.getJob(GENERATE_REPORT_JOB_TYPE, jobId)

      if (!job || (job.data.userId !== sub && role !== UserRole.ADMIN)) {
        await sse.writeSSE({
          data: JSON.stringify(ReportEventDataSchema.parse({ status: REPORT_SSE_STATUS.NOT_FOUND })),
          event: ReportEventEnumSchema.parse(REPORT_SSE_EVENTS.ERROR),
        })
        break
      }

      switch (job.state) {
        case 'completed': {
          const output = job.output
          if (output?.fileKey) {
            const downloadUrl = await getSignedDownloadUrl(output.fileKey)
            await sse.writeSSE({
              data: JSON.stringify(ReportEventDataSchema.parse({
                status: REPORT_SSE_STATUS.COMPLETED,
                downloadUrl,
              })),
              event: ReportEventEnumSchema.parse(REPORT_SSE_EVENTS.FINISHED),
            })
          }
          else {
            await sse.writeSSE({
              data: JSON.stringify(ReportEventDataSchema.parse({
                status: REPORT_SSE_STATUS.ERROR,
                message: 'Missing file key',
              })),
              event: ReportEventEnumSchema.parse(REPORT_SSE_EVENTS.ERROR),
            })
          }
          completed = true
          break
        }
        case 'failed': {
          const message = typeof job.output === 'string'
            ? job.output
            : (job.output as any)?.message || 'Internal processing error'

          await sse.writeSSE({
            data: JSON.stringify(ReportEventDataSchema.parse({
              status: REPORT_SSE_STATUS.FAILED,
              message,
            })),
            event: ReportEventEnumSchema.parse(REPORT_SSE_EVENTS.ERROR),
          })
          completed = true
          break
        }
        case 'active':
        case 'created':
        case 'retry':
        default: {
          await sse.writeSSE({
            data: JSON.stringify(ReportEventDataSchema.parse({ status: job.state })),
            event: ReportEventEnumSchema.parse(REPORT_SSE_EVENTS.UPDATE),
          })
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }
    }
  })
}
