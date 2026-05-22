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

  async send(
    input: SendEmailInput,
    options?: { tx?: Prisma.TransactionClient, singletonKey?: string },
  ): Promise<SendEmailResult> {
    try {
      const jobId = options?.singletonKey || this.generateIdempotencyKey(input)

      await jobManager.emit('send-email', input, {
        singletonKey: jobId,
        tx: options?.tx,
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
        to: input.to,
        subject: input.subject,
        templateType: input.template?.type,
      }, 'Failed to queue email')

      return {
        success: false,
        error: EMAIL_ERROR_CODES.FAILED_TO_SEND,
      }
    }
  }
}

export const emailService = new EmailService()
