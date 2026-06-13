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

export type PasswordRecoveryTemplateData = {
  type: 'password-recovery'
  props: {
    resetToken: string
    expiryTime?: string
  }
}

export type StaffNotificationTemplateData = {
  type: 'staff-notification'
  props: {
    staffName: string
    eventDetails: string[]
    expenseTitle: string
    status: ExpenseRequestStatus
    date: string
    actionUrl: string
    projectName?: string | null
    categories?: string[]
    articleClassification?: string
  }
}

export type TemplateData = StatusChangeTemplateData | PasswordRecoveryTemplateData | StaffNotificationTemplateData

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
