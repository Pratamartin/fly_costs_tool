import type { EmailProvider, SendEmailInput, SendEmailResult } from '../type'
import nodemailer from 'nodemailer'

export class EtherealProvider implements EmailProvider {
  private transporterPromise?: Promise<nodemailer.Transporter>

  private async getTransporter() {
    if (this.transporterPromise) {
      return this.transporterPromise
    }

    this.transporterPromise = (async () => {
      const testAccount = await nodemailer.createTestAccount()

      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
        connectionTimeout: 10000,
      })
    })()

    return this.transporterPromise
  }

  async send(
    input: SendEmailInput,
  ): Promise<SendEmailResult> {
    try {
      const transporter = await this.getTransporter()

      const info = await transporter.sendMail({
        from: 'SGDA Test <no-reply@ethereal.email>',
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      })

      return {
        success: true,
        sent: true,
        previewUrl: nodemailer.getTestMessageUrl(info) || undefined,
      }
    }
    catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error sending email via Ethereal',
      }
    }
  }
}
