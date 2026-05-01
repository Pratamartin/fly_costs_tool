import type { UserRole } from '@/generated/prisma/enums'
import { expect } from 'vitest'
import env from '@/env'
import { generateAccessToken } from '@/services/auth.service'
import { getUserByEmail } from '@/services/user.service'

export default async function getAuthHeaders(email: string, role: UserRole) {
  const user = await getUserByEmail(email)

  expect(user, `Falha no setup: Usuário ${email} não encontrado no banco.`).toBeTruthy()

  const token = await generateAccessToken({
    sub: user!.id,
    role,
  }, env.JWT_SECRET)

  return { Authorization: `Bearer ${token}` }
}
