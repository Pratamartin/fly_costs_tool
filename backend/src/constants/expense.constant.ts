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
  [ExpenseRequestStatus.EM_PROCESSAMENTO]: [
    ExpenseRequestStatus.CONCLUIDO,
  ],
  [ExpenseRequestStatus.CONCLUIDO]: [],
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
    ExpenseRequestStatus.CONCLUIDO,
  ],
}

/**
 * Mapeia se o aluno deve ser enviado para a página de Detalhes ou Edição.
 * Por padrão é 'detail', mas EM_EDICAO exige 'edit'.
 */
export const FRONTEND_PATH_BY_STATUS: Partial<Record<ExpenseRequestStatus, 'detail' | 'edit'>> = { [ExpenseRequestStatus.EM_EDICAO]: 'edit' }

/**
 * Restrições extras de cargo para transições específicas.
 * Ex: Apenas ADMIN pode colocar uma despesa em EM_EDICAO.
 */
export const REQUIRED_ROLE_FOR_STATUS: Partial<Record<ExpenseRequestStatus, UserRole[]>> = { [ExpenseRequestStatus.EM_EDICAO]: [UserRole.ADMIN] }

/**
 * Mapeia quais cargos do staff devem ser notificados baseado no novo status da despesa.
 *
 * PENDENTE -> Coordenadores (para avaliação)
 * APROVADO -> Admins (para processamento financeiro)
 */
export const STAFF_NOTIFICATION_TARGETS_BY_STATUS: Partial<Record<ExpenseRequestStatus, UserRole[]>> = {
  [ExpenseRequestStatus.PENDENTE]: [UserRole.COORDENADOR],
  [ExpenseRequestStatus.APROVADO]: [UserRole.ADMIN],
}

export const ALLOWED_STATUSES_FOR_COST_ALLOCATION: ExpenseRequestStatus[] = [
  ExpenseRequestStatus.EM_PROCESSAMENTO,
] as const

export const EXPENSE_CATEGORIES_WITH_RECEIPT_REQUIRED = [
  'passagem-aerea',
] as const
