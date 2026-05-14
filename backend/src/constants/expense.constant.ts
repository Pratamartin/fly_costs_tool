import { ExpenseRequestStatus, UserRole } from '@/generated/prisma/enums'

export const STATUSES_WHERE_REASON_REQUIRED: ExpenseRequestStatus[] = [
  ExpenseRequestStatus.REJEITADO,
  ExpenseRequestStatus.EM_EDICAO,
] as const

export const EXPENSE_STATUS_TRANSITIONS: Record<ExpenseRequestStatus, ExpenseRequestStatus[]> = {
  [ExpenseRequestStatus.PENDENTE]: [
    ExpenseRequestStatus.APROVADO,
    ExpenseRequestStatus.REJEITADO,
  ],
  [ExpenseRequestStatus.APROVADO]: [
    ExpenseRequestStatus.EM_EDICAO,
    ExpenseRequestStatus.EM_PROCESSAMENTO,
  ],
  [ExpenseRequestStatus.EM_EDICAO]: [
    ExpenseRequestStatus.APROVADO,
  ],
  [ExpenseRequestStatus.REJEITADO]: [],
  [ExpenseRequestStatus.EM_PROCESSAMENTO]: [],
} as const

export const EXPENSE_VISIBILITY_BY_ROLE: Record<UserRole, ExpenseRequestStatus[]> = {
  [UserRole.ALUNO]: Object.values(ExpenseRequestStatus),
  [UserRole.COORDENADOR]: [
    ExpenseRequestStatus.PENDENTE,
    ExpenseRequestStatus.APROVADO,
    ExpenseRequestStatus.REJEITADO,
  ],
  [UserRole.ADMIN]: [
    ExpenseRequestStatus.APROVADO,
    ExpenseRequestStatus.EM_EDICAO,
    ExpenseRequestStatus.EM_PROCESSAMENTO,
  ],
}

export const EXPENSE_ERROR_CODES = {
  REASON_REQUIRED: 'REASON_REQUIRED',
  RETURN_BEFORE_DEPARTURE: 'RETURN_DATE_BEFORE_DEPARTURE',
  STORAGE_NOT_CONFIGURED: 'STORAGE_NOT_CONFIGURED',
  MEMORANDUM_MISSING: 'MEMORANDUM_MISSING',
} as const
