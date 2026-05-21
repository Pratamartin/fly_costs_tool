import type { Job } from 'pg-boss'
import type { SendEmailInput } from '@/lib/email/type'
import { createEmailProvider } from '@/lib/email/providers'
import { StatusChangeEmail } from '@/lib/email/templates'
import { renderEmailHtml } from '@/lib/email/util'
import { BaseJob } from '@/lib/jobs'
import { logger } from '@/lib/logger'

export type EmailJobData = {
  requestId?: string
} & SendEmailInput

export class SendEmailJob extends BaseJob<EmailJobData> {
  readonly type = 'send-email' as const

  override readonly options = {
    retryLimit: 5,
    retryDelay: 60,
    retryBackoff: true,
  }

  private async renderTemplate(template: NonNullable<SendEmailInput['template']>): Promise<string> {
    switch (template.type) {
      case 'status-change': {
        const component = await StatusChangeEmail(template.props)
        if (!component) {
          throw new Error('Failed to render status-change email component')
        }
        return renderEmailHtml(component.toString())
      }
      default:
        throw new Error(`Unknown template type: ${(template as any).type}`)
    }
  }

  async work(job: Job<EmailJobData>): Promise<void> {
    const provider = createEmailProvider()

    logger.info({
      jobId: job.id,
      to: job.data.to,
    }, 'Processing email job')

    const html = job.data.html || (job.data.template ? await this.renderTemplate(job.data.template) : undefined)

    if (!html) {
      throw new Error('No HTML content or template provided for email job')
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
