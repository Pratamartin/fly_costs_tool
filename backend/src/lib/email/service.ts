import type { SendEmailInput, SendEmailResult } from './type'
import type { Prisma } from '@/generated/prisma/client'
import crypto from 'node:crypto'
import { EMAIL_ERROR_CODES } from '@/constants/email.constant'
import { jobManager } from '@/jobs'
import { logger } from '@/lib/logger'

export class EmailService {
  private generateIdempotencyKey(input: SendEmailInput): string {
    const payload = input.html || JSON.stringify(input.template || {})
    return crypto
      .createHash('sha256')
      .update(`${input.to}:${input.subject}:${payload}`)
      .digest('hex')
  }

  async send(input: SendEmailInput, tx?: Prisma.TransactionClient): Promise<SendEmailResult> {
    try {
      const jobId = this.generateIdempotencyKey(input)

      await jobManager.emit('send-email', input, {
        singletonKey: jobId,
        tx,
      })

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
