import type { z } from '@hono/zod-openapi'
import type { InviteStatus } from '@/constants/invite.constant'
import type { InviteCode, Prisma, UserRole } from '@/generated/prisma/client'
import type { ListInvitesQuerySchema } from '@/schemas/admin.invite.schema'
import crypto from 'node:crypto'
import * as phrases from 'stoker/http-status-phrases'
import { INVITE_EXPIRY, INVITE_STATUS } from '@/constants/invite.constant'
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

function generateRandomCode(bytes: number = 4): string {
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

export async function revokeInvite(id: string): Promise<InviteCode | { error: string }> {
  const invite = await prisma.inviteCode.findUnique({ where: { id } })
  if (!invite) {
    return { error: phrases.NOT_FOUND }
  }

  return prisma.inviteCode.update({
    where: { id },
    data: { expiresAt: dayjs().toDate() },
  })
}

export async function findActiveInvite(code: string, tx: Prisma.TransactionClient = prisma) {
  const invite = await tx.inviteCode.findUnique({ where: { code } })

  if (!invite || mapInviteStatus(invite) !== INVITE_STATUS.ACTIVE) {
    return null
  }

  return invite
}

export async function validateAndConsume(code: string, userId: string, tx: Prisma.TransactionClient = prisma): Promise<InviteCode | { error: string }> {
  const invite = await findActiveInvite(code, tx)
  if (!invite) {
    return { error: 'Convite inválido, já utilizado ou expirado.' }
  }

  return tx.inviteCode.update({
    where: { id: invite.id },
    data: {
      usedById: userId,
      usedAt: dayjs().toDate(),
    },
  })
}
