import { UserRole } from '@/generated/prisma/enums'

export const ROLES_ALLOWED_TO_HAVE_PROFILE: UserRole[] = [
  UserRole.ALUNO,
] as const

export const ROLE_FRONTEND_SLUG: Record<UserRole, string> = {
  [UserRole.ALUNO]: 'student',
  [UserRole.COORDENADOR]: 'coordinator',
  [UserRole.ADMIN]: 'admin',
}
