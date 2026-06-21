import type { InviteStatus } from '@/constants/invite.constant'
import type { ExpenseRequestStatus } from '@/generated/prisma/enums'
import { z } from '@hono/zod-openapi'
import { STATUSES_WHERE_REASON_REQUIRED } from '@/constants/expense.constant'
import { ALLOWED_RECEIPT_MIME_TYPES } from '@/constants/file.constant'
import { INVITE_STATUS } from '@/constants/invite.constant'
import { dayjs } from '@/lib/date'
import { validatePDF } from '@/lib/storage'
import { getInviteMinExpiry } from '@/services/invite.service'

export const projectPeriodCheck = z.refine<{ startDate: Date, endDate: Date }>(
  data => data.endDate >= data.startDate,
  {
    message: 'The end date must be greater than or equal to the start date.',
    path: ['endDate'],
  },
)

export const reasonFieldRequired = z.refine<{ status: ExpenseRequestStatus, reason?: string | null }>(
  (value) => {
    if (!STATUSES_WHERE_REASON_REQUIRED.includes(value.status)) {
      return true
    }

    return !!value.reason && value.reason.length > 0
  },
  {
    message: 'Reason is required for the selected status',
    path: ['reason'],
    params: { requiredForStatuses: STATUSES_WHERE_REASON_REQUIRED },
  },
)

export function validPDFCheck(maxSizeInMB: number) {
  return async (value: File, ctx: z.RefinementCtx) => {
    const validation = await validatePDF(value, maxSizeInMB)

    if (!validation.valid) {
      ctx.addIssue({
        code: 'custom',
        message: validation.error,
        path: ['file'],
        params: {
          maxSizeInMB,
          mimeType: value.type,
          size: value.size,
        },
      })
    }
  }
}

export function maskBankAccountTransform(val: string | undefined): string | undefined {
  if (!val)
    return val
  return val.length > 4 ? `****${val.slice(-4)}` : '****'
}

export const validBirthDate = z.coerce.date().superRefine((date, ctx) => {
  const today = new Date()

  const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate())

  const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())

  if (date > maxDate) {
    ctx.addIssue({
      code: 'custom',
      message: 'You must be at least 18 years old to register.',
      params: {
        minAge: 18,
        maxDate: maxDate.toISOString(),
      },
    })
  }

  if (date < minDate) {
    ctx.addIssue({
      code: 'custom',
      message: 'Invalid birth date (maximum age is 120 years).',
      params: {
        maxAge: 120,
        minDate: minDate.toISOString(),
      },
    })
  }
})

const bankCodeRegex = /^\d{3}$/
export const validBankCode = z.string().superRefine((val, ctx) => {
  if (!bankCodeRegex.test(val)) {
    ctx.addIssue({
      code: 'custom',
      message: 'Invalid bank code. Use a 3-digit COMPE code (e.g., 001).',
      params: {
        pattern: bankCodeRegex.source,
        length: 3,
      },
    })
  }
})

export const regexBankAgency = /^\d{3,5}(?:-[0-9X])?$/i
export const validBankAgency = z.string().trim()
  .toUpperCase()
  .superRefine((val, ctx) => {
    if (!regexBankAgency.test(val)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Invalid bank agency format. Example: 1234-X or 0001',
        params: {
          pattern: regexBankAgency.source,
          format: 'brazilian_agency',
        },
      })
    }
  })

export const regexBankAccount = /^\d{4,12}(?:-[0-9X])?$/i
export const validBankAccount = z.string().trim()
  .toUpperCase()
  .superRefine((val, ctx) => {
    if (!regexBankAccount.test(val)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Invalid bank account format. Example: 56789-0',
        params: {
          pattern: regexBankAccount.source,
          format: 'brazilian_account',
        },
      })
    }
  })

export const regexIdentityDoc = /^[A-Z0-9.-]{4,20}$/i
export const validIdentityDoc = z.string().trim()
  .toUpperCase()
  .superRefine((val, ctx) => {
    if (!regexIdentityDoc.test(val)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Invalid identity document format. Use only letters, numbers, dots, and hyphens (4-20 chars).',
        params: {
          pattern: regexIdentityDoc.source,
          min: 4,
          max: 20,
        },
      })
    }
  })

export function minExpiryThresholdCheck() {
  return (value: { expiresAt?: Date }, ctx: z.RefinementCtx) => {
    const minExpiry = getInviteMinExpiry()

    if (value.expiresAt && dayjs(value.expiresAt).isBefore(minExpiry)) {
      const formattedDate = dayjs.utc(value.expiresAt).format('LT')
      const formattedLimit = dayjs.utc(minExpiry).format('LT')

      ctx.addIssue({
        code: 'custom',
        message: `The date ${formattedDate} is invalid. The minimum acceptable is ${formattedLimit}.`,
        path: ['expiresAt'],
        params: { minExpiry: minExpiry.toISOString() },
      })
    }
  }
}

export const usedInviteFieldsRequired = z.refine<{
  status: InviteStatus
  usedById?: string | null
  usedAt?: Date | null
}>(
  (value) => {
    if (value.status !== INVITE_STATUS.USED)
      return true

    return !!value.usedById && !!value.usedAt
  },
  {
    message: 'Usage data (who and when) are required for used invites',
    path: ['status'],
    params: { requiredForStatus: INVITE_STATUS.USED },
  },
)

export function validReceiptFileCheck(maxSizeInMB: number) {
  const maxSizeBytes = maxSizeInMB * 1024 * 1024

  return (value: File, ctx: z.RefinementCtx) => {
    if (value.size > maxSizeBytes) {
      ctx.addIssue({
        code: 'custom',
        message: `File exceeds the maximum size of ${maxSizeInMB}MB`,
        params: {
          maxSizeInMB,
          maxSizeBytes,
          size: value.size,
        },
      })
      return
    }

    if (!(ALLOWED_RECEIPT_MIME_TYPES as readonly string[]).includes(value.type)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Unsupported file format. Use PDF or Images (JPG, PNG).',
        params: {
          allowedMimeTypes: ALLOWED_RECEIPT_MIME_TYPES,
          mimeType: value.type,
        },
      })
    }
  }
}
