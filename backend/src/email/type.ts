export type SendEmailInput = {
  to: string
  subject: string
  html: string
  text?: string
}

export type SendEmailResult
  = | {
    success: true
    queued: true
    jobId: string
  }
  | {
    success: true
    sent: true
    previewUrl?: string
  }
  | {
    success: false
    error: string
  }

export type EmailJob = {
  requestId?: string
} & SendEmailInput

export type EmailProvider = {
  send: (input: SendEmailInput) => Promise<SendEmailResult>
}
