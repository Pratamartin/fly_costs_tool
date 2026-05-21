import type { EmailJob, SendEmailInput, SendEmailResult } from './type'
import { Queue } from 'bullmq'
import { EMAIL_ERROR_CODES, EMAIL_QUEUE_NAME, EMAIL_SEND_ATTEMPTS } from '@/constants/email.constant'
import { logger } from '@/lib/logger'
import { redis } from '@/lib/redis'
import { createEmailJobId } from './util'

export class EmailService {
  private queue: Queue<EmailJob> | undefined

  constructor() {
    if (redis) {
      this.queue = new Queue(EMAIL_QUEUE_NAME, {
        connection: redis,
        defaultJobOptions: {
          attempts: EMAIL_SEND_ATTEMPTS,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      })
    }
    else {
      logger.warn('Redis not configured. Email queue will not be available.')
    }
  }

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    if (!this.queue) {
      return {
        success: false,
        error: EMAIL_ERROR_CODES.TRANSPORT_NOT_CONFIGURED,
      }
    }

    try {
      const jobId = createEmailJobId(input.to, input.subject, input.html)

      await this.queue.add('send-email', input, { jobId })

      return {
        success: true,
        queued: true,
        jobId,
      }
    }
    catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error queueing email'
      logger.error({
        error: message,
        input,
      }, 'Failed to queue email')

      return {
        success: false,
        error: EMAIL_ERROR_CODES.FAILED_TO_SEND,
      }
    }
  }
}

export const emailService = new EmailService()
