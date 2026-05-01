import { ExpenseRequestStatus } from '@/generated/prisma/enums'

export const STATUSES_WHERE_REASON_REQUIRED: ExpenseRequestStatus[] = [
  ExpenseRequestStatus.REJEITADO,
] as const

export const STATUSES_FOR_COORDINATOR_ANALYSIS: ExpenseRequestStatus[] = [
  ExpenseRequestStatus.PENDENTE,
] as const

export const STATUSES_ALLOWED_TO_ASSIGN_PROJECT: ExpenseRequestStatus[] = [
  ExpenseRequestStatus.APROVADO,
] as const

export const EXPENSE_ERROR_CODES = {
  REASON_REQUIRED: 'REASON_REQUIRED',
  RETURN_BEFORE_DEPARTURE: 'RETURN_DATE_BEFORE_DEPARTURE',

} as const
