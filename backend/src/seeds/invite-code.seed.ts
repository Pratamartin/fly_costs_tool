import type { Prisma } from '@/generated/prisma/client'
import { MOCK_INVITE_ADMIN, MOCK_INVITE_ALUNO, MOCK_INVITE_COORD } from '@/constants/seed.constant'
import { UserRole } from '@/generated/prisma/client'
import { logger } from '@/lib/logger'
import prisma from '@/lib/orm'
import { getInviteDefaultExpiry } from '@/services/invite.service'

export const dummyInviteCodes = [
  {
    code: MOCK_INVITE_ALUNO,
    role: UserRole.ALUNO,
    expiresAt: getInviteDefaultExpiry(),
  },
  {
    code: MOCK_INVITE_COORD,
    role: UserRole.COORDENADOR,
    expiresAt: getInviteDefaultExpiry(),
  },
  {
    code: MOCK_INVITE_ADMIN,
    role: UserRole.ADMIN,
    expiresAt: getInviteDefaultExpiry(),
  },
] satisfies Prisma.InviteCodeCreateInput[]

async function seedInviteCodes() {
  logger.info('🎫 Seeding Invite Codes...')

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
