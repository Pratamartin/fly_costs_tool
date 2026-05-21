import type { EmailJob } from './type'
import { Worker } from 'bullmq'
import { EMAIL_QUEUE_NAME } from '@/constants/email.constant'
import { logger } from '@/lib/logger'
import { redis } from '@/lib/redis'
import { createEmailProvider } from './providers'

export function setupEmailWorker() {
  if (!redis) {
    logger.error('Redis not configured. Email worker will not start.')
    return
  }

  const provider = createEmailProvider()

  const worker = new Worker<EmailJob>(
    EMAIL_QUEUE_NAME,
    async (job) => {
      logger.info({
        jobId: job.id,
        to: job.data.to,
      }, 'Processing email job')

      const result = await provider.send(job.data)

      if (!result.success) {
        throw new Error(result.error)
      }

      const previewUrl = (result.success && 'sent' in result) ? result.previewUrl : undefined
      logger.info({
        jobId: job.id,
        previewUrl,
      }, 'Email job completed successfully')

      return result
    },
    {
      connection: redis,
      concurrency: 5,
    },
  )

  worker.on('failed', (job, err) => {
    logger.error({
      jobId: job?.id,
      error: err.message,
    }, 'Email job failed')
  })

  return worker
}
