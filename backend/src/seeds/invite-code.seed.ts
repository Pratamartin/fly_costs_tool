/* eslint-disable no-console */
import type { Prisma } from '@/generated/prisma/client'
import { UserRole } from '@/generated/prisma/client'
import prisma from '@/lib/orm'
import { getInviteDefaultExpiry } from '@/services/invite.service'

export const dummyInviteCodes = [
  {
    code: 'aluno2026',
    role: UserRole.ALUNO,
    expiresAt: getInviteDefaultExpiry(),
  },
  {
    code: 'coordenador2026',
    role: UserRole.COORDENADOR,
    expiresAt: getInviteDefaultExpiry(),
  },
  {
    code: 'admin2026',
    role: UserRole.ADMIN,
    expiresAt: getInviteDefaultExpiry(),
  },
] satisfies Prisma.InviteCodeCreateInput[]

async function seedInviteCodes() {
  console.log('🎫 Seeding Invite Codes...')

  for (const data of dummyInviteCodes) {
    const expiresAt = getInviteDefaultExpiry()
    await prisma.inviteCode.upsert({
      where: { code: data.code },
      update: {
        role: data.role,
        expiresAt,
      },
      create: {
        ...data,
        expiresAt,
      },
    })
  }
}

export default seedInviteCodes
