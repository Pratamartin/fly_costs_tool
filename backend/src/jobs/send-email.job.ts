import type { Job } from 'pg-boss'
import type { SendEmailInput } from '@/lib/email/type'
import { EMAIL_ERROR_CODES } from '@/constants/email.constant'
import { createEmailProvider } from '@/lib/email/providers'
import { PasswordRecoveryEmail, StatusChangeEmail } from '@/lib/email/templates'
import { renderEmailHtml } from '@/lib/email/util'
import { BaseJob } from '@/lib/jobs'
import { logger } from '@/lib/logger'

export type EmailJobData = {
  requestId?: string
} & SendEmailInput

export class SendEmailJob extends BaseJob<EmailJobData, void> {
  readonly type = 'send-email' as const

  override readonly options = {
    retryLimit: 5,
    retryDelay: 60,
    retryBackoff: true,
  }

  override readonly workOptions = {
    localConcurrency: 2,
    batchSize: 1,
  }

  private async renderTemplate(template: NonNullable<SendEmailInput['template']>): Promise<{ success: true, html: string } | { success: false, error: string }> {
    try {
      switch (template.type) {
        case 'status-change': {
          const component = await StatusChangeEmail(template.props)
          if (!component) {
            return {
              success: false,
              error: EMAIL_ERROR_CODES.FAILED_TO_RENDER_TEMPLATE,
            }
          }
          return {
            success: true,
            html: renderEmailHtml(component.toString()),
          }
        }
        case 'password-recovery': {
          const component = await PasswordRecoveryEmail(template.props)
          if (!component) {
            return {
              success: false,
              error: EMAIL_ERROR_CODES.FAILED_TO_RENDER_TEMPLATE,
            }
          }
          return {
            success: true,
            html: renderEmailHtml(component.toString()),
          }
        }
        default:
          return {
            success: false,
            error: EMAIL_ERROR_CODES.INVALID_PAYLOAD,
          }
      }
    }
    catch (err) {
      logger.error({
        err,
        templateType: template.type,
      }, 'Error rendering email template')
      return {
        success: false,
        error: EMAIL_ERROR_CODES.FAILED_TO_RENDER_TEMPLATE,
      }
    }
  }

  async work(job: Job<EmailJobData>): Promise<void> {
    const provider = createEmailProvider()

    logger.info({
      jobId: job.id,
      to: job.data.to,
      requestId: job.data.requestId,
    }, 'Processing email job')

    let html = job.data.html

    if (!html && job.data.template) {
      const renderResult = await this.renderTemplate(job.data.template)
      if (!renderResult.success) {
        throw new Error(renderResult.error)
      }
      html = renderResult.html
    }

    if (!html) {
      throw new Error(EMAIL_ERROR_CODES.INVALID_PAYLOAD)
    }

    const result = await provider.send({
      ...job.data,
      html,
    })

    if (!result.success) {
      throw new Error(result.error)
    }

    const previewUrl = (result.success && 'sent' in result) ? result.previewUrl : undefined
    logger.info({
      jobId: job.id,
      previewUrl,
    }, 'Email job completed successfully')
  }
}
