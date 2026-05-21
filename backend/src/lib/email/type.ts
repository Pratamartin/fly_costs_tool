import type { ExpenseRequestStatus } from '@/generated/prisma/client'

export type StatusChangeTemplateData = {
  type: 'status-change'
  props: {
    studentName: string
    expenseDescription: string
    newStatus: ExpenseRequestStatus
    date: string
    detailPage: string
    reason?: string | null
    projectName?: string | null
    hasMemorandum?: boolean
  }
}

export type TemplateData = StatusChangeTemplateData

export type SendEmailInput = {
  to: string
  subject: string
  html?: string
  template?: TemplateData
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

export type EmailProvider = {
  send: (input: Required<Pick<SendEmailInput, 'to' | 'subject' | 'html'>> & Pick<SendEmailInput, 'text'>) => Promise<SendEmailResult>
}
