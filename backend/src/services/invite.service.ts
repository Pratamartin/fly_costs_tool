import type { z } from '@hono/zod-openapi'
import type { InviteStatus } from '@/constants/invite.constant'
import type { InviteCode, Prisma, UserRole } from '@/generated/prisma/client'
import type { ServiceResult } from '@/lib/problems'
import type { ListInvitesQuerySchema } from '@/schemas/admin.invite.schema'
import crypto from 'node:crypto'
import { INVITE_CODE_BYTES, INVITE_EXPIRY, INVITE_STATUS } from '@/constants/invite.constant'
import { dayjs } from '@/lib/date'
import prisma from '@/lib/orm'

export function mapInviteStatus(invite: InviteCode): InviteStatus {
  if (invite.usedById)
    return INVITE_STATUS.USED
  if (dayjs().isAfter(invite.expiresAt))
    return INVITE_STATUS.EXPIRED
  return INVITE_STATUS.ACTIVE
}

export function getInviteDefaultExpiry() {
  return dayjs().add(INVITE_EXPIRY.DEFAULT_HOURS, 'hours')
    .toDate()
}

export function getInviteMinExpiry() {
  return dayjs().add(INVITE_EXPIRY.MIN_MINUTES, 'minutes')
    .toDate()
}

export function getInviteExampleExpiry() {
  return dayjs().add(INVITE_EXPIRY.MIN_MINUTES, 'minutes')
    .toISOString()
}

function generateRandomCode(bytes: number = INVITE_CODE_BYTES): string {
  return crypto.randomBytes(bytes).toString('hex')
    .toUpperCase()
}

export async function createInvite(role: UserRole, expiresAt?: Date) {
  const code = generateRandomCode()

  return prisma.inviteCode.create({
    data: {
      code,
      role,
      expiresAt: expiresAt ?? getInviteDefaultExpiry(),
    },
  })
}

export async function listInvites(filters: z.infer<typeof ListInvitesQuerySchema>) {
  const { role, status, search } = filters

  const where: Prisma.InviteCodeWhereInput = {
    role,
    code: {
      contains: search,
      mode: 'insensitive',
    },
  }

  switch (status) {
    case INVITE_STATUS.USED:
      where.usedById = { not: null }
      break

    case INVITE_STATUS.EXPIRED:
      where.usedById = null
      where.expiresAt = { lt: dayjs().toDate() }
      break

    case INVITE_STATUS.ACTIVE:
      where.usedById = null
      where.expiresAt = { gt: dayjs().toDate() }
      break
  }

  const invites = await prisma.inviteCode.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  return invites.map(invite => ({
    ...invite,
    status: mapInviteStatus(invite),
  }))
}

export async function revokeInvite(id: string): Promise<ServiceResult<InviteCode, 'INVITE_NOT_FOUND' | 'INVITE_ALREADY_USED' | 'INVITE_ALREADY_EXPIRED'>> {
  const invite = await prisma.inviteCode.findUnique({ where: { id } })
  if (!invite) {
    return { error: 'INVITE_NOT_FOUND' }
  }

  const status = mapInviteStatus(invite)
  if (status === INVITE_STATUS.USED) {
    return {
      error: 'INVITE_ALREADY_USED',
      context: { usedAt: invite.usedAt?.toISOString() ?? null },
    }
  }

  if (status === INVITE_STATUS.EXPIRED) {
    return {
      error: 'INVITE_ALREADY_EXPIRED',
      context: { expiredAt: invite.expiresAt.toISOString() },
    }
  }

  return prisma.inviteCode.update({
    where: { id },
    data: { expiresAt: dayjs().toDate() },
  })
}

export async function findInviteByCode(code: string, tx: Prisma.TransactionClient = prisma): Promise<ServiceResult<InviteCode, 'INVITE_NOT_FOUND' | 'INVITE_ALREADY_USED' | 'INVITE_ALREADY_EXPIRED'>> {
  const invite = await tx.inviteCode.findUnique({ where: { code } })

  if (!invite) {
    return { error: 'INVITE_NOT_FOUND' }
  }

  const status = mapInviteStatus(invite)
  if (status === INVITE_STATUS.USED) {
    return {
      error: 'INVITE_ALREADY_USED',
      context: { usedAt: invite.usedAt?.toISOString() ?? null },
    }
  }

  if (status === INVITE_STATUS.EXPIRED) {
    return {
      error: 'INVITE_ALREADY_EXPIRED',
      context: { expiredAt: invite.expiresAt.toISOString() },
    }
  }

  return invite
}

export async function validateAndConsume(code: string, userId: string, tx: Prisma.TransactionClient = prisma): Promise<ServiceResult<InviteCode, 'INVITE_NOT_FOUND' | 'INVITE_ALREADY_USED' | 'INVITE_ALREADY_EXPIRED'>> {
  const result = await findInviteByCode(code, tx)

  if ('error' in result) {
    return result
  }

  return tx.inviteCode.update({
    where: { id: result.id },
    data: {
      usedById: userId,
      usedAt: dayjs().toDate(),
    },
  })
}
