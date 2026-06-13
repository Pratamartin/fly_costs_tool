import type { UserRole } from '@/generated/prisma/enums'
import env from '@/env'
import { generateAccessToken } from '@/services/auth.service'
import { getUserByEmail } from '@/services/user.service'

export default async function getAuthHeaders(email: string, role: UserRole) {
  const result = await getUserByEmail(email)

  if ('error' in result) {
    throw new Error(`Test setup failed: User ${email} not found in the database.`)
  }

  const user = result

  const token = await generateAccessToken({
    sub: user.id,
    role,
  }, env.JWT_SECRET)

  return { Authorization: `Bearer ${token}` }
}
