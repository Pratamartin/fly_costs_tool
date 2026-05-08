import { UserRole } from '@/generated/prisma/enums'

export const USER_ERROR_CODES = {
  CPF_ALREADY_USED: 'CPF_ALREADY_USED',
  PROFILE_UPDATE_NOT_ALLOWED: 'PROFILE_UPDATE_NOT_ALLOWED',
} as const

export const ROLES_ALLOWED_TO_HAVE_PROFILE: UserRole[] = [
  UserRole.ALUNO,
] as const
