import { UserRole } from '@/generated/prisma/enums'

export const ROLES_ALLOWED_TO_HAVE_PROFILE: UserRole[] = [
  UserRole.ALUNO,
] as const
