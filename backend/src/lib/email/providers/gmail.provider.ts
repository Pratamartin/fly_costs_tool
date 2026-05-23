import type { EmailProvider, SendEmailInput, SendEmailResult } from '../type'
import { google } from 'googleapis'
import MailComposer from 'nodemailer/lib/mail-composer/index.js'

const PLUS_REGEX = /\+/g
const SLASH_REGEX = /\//g
const EQUAL_REGEX = /=+$/

export class GmailProvider implements EmailProvider {
  private gmail: ReturnType<typeof google.gmail>

  constructor(private config: {
    from: string
    clientId: string
    clientSecret: string
    redirectUri: string
    refreshToken: string
  }) {
    const oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri,
    )

    oauth2Client.setCredentials({ refresh_token: config.refreshToken })

    this.gmail = google.gmail({
      version: 'v1',
      auth: oauth2Client,
    })
  }

  async send(
    input: SendEmailInput,
  ): Promise<SendEmailResult> {
    try {
      const mail = new MailComposer({
        from: this.config.from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      })

      const message = await mail.compile().build()

      const encodedMessage = message
        .toString('base64')
        .replace(PLUS_REGEX, '-')
        .replace(SLASH_REGEX, '_')
        .replace(EQUAL_REGEX, '')

      await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: encodedMessage },
      })

      return {
        success: true,
        sent: true,
      }
    }
    catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error sending email via Gmail',
      }
    }
  }
}
