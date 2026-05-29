import type { z } from '@hono/zod-openapi'
import type { Job } from 'pg-boss'
import type { UserRole } from '@/generated/prisma/enums'
import type { ExpenseReportQuerySchema } from '@/schemas/expense.schema'
import { GENERATE_REPORT_JOB_TYPE, REPORT_JOB_OPTIONS } from '@/constants/expense.report.constant'
import { BaseJob } from '@/lib/jobs'
import { logger } from '@/lib/logger'
import { generateExpenseReportPDF } from '@/lib/pdf-report'
import { uploadStream } from '@/lib/storage'
import { getReportViewModel } from '@/services/reports'

export type GenerateReportJobData = {
  userId: string
  role: UserRole
  query: z.infer<typeof ExpenseReportQuerySchema>
}

export type GenerateReportJobOutput = {
  fileKey: string
}

export class GenerateReportJob extends BaseJob<GenerateReportJobData, GenerateReportJobOutput> {
  readonly type = GENERATE_REPORT_JOB_TYPE

  override readonly options = REPORT_JOB_OPTIONS

  async work(job: Job<GenerateReportJobData>): Promise<GenerateReportJobOutput> {
    const { userId, role, query } = job.data

    logger.info({
      jobId: job.id,
      userId,
      query,
    }, 'Processing expense report generation job')

    try {
      const viewModel = await getReportViewModel(userId, role, query)

      const pdfDoc = await generateExpenseReportPDF(viewModel, query)

      const fileName = `report-${job.id}.pdf`

      const uploadPromise = uploadStream({
        stream: pdfDoc,
        fileName,
        contentType: 'application/pdf',
        folder: 'reports',
      })

      pdfDoc.end()

      const uploadResult = await uploadPromise

      logger.info({
        jobId: job.id,
        fileKey: uploadResult.fileKey,
      }, 'Expense report generated and uploaded successfully')

      return { fileKey: uploadResult.fileKey }
    }
    catch (error) {
      logger.error({
        err: error,
        jobId: job.id,
      }, 'Failed to generate expense report in worker')
      throw error
    }
  }
}
