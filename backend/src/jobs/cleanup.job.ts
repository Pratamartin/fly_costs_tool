import env from '@/env'
import { dayjs } from '@/lib/date'
import { BaseJob } from '@/lib/jobs'
import { logger } from '@/lib/logger'
import prisma from '@/lib/orm'

const BATCH_SIZE = 1000

type CleanupStepResult = {
  entity: string
  status: 'success' | 'error'
  deletedCount: number
  durationMs: number
  error?: string
}

export class CleanupJob extends BaseJob {
  readonly type = 'cleanup-system-data'

  async work() {
    logger.info('Starting resilient system cleanup sequence...')

    await this.runStep('UserSession', () => this.cleanRevokedRefreshTokens())
    await this.runStep('InviteCode_Pending', () => this.cleanPendingInvites())
    await this.runStep('InviteCode_Used', () => this.cleanUsedInvites())
    await this.runStep('UserPasswordResetFields', () => this.cleanPasswordResetTokens())

    logger.info('System cleanup sequence completed.')
  }

  private async runStep(name: string, cleanupFn: () => Promise<number>) {
    const startTime = performance.now()

    try {
      const deletedCount = await cleanupFn()
      const durationMs = Math.round(performance.now() - startTime)

      const result: CleanupStepResult = {
        entity: name,
        status: 'success',
        deletedCount,
        durationMs,
      }

      logger.info(result, `Cleanup step ${name} completed`)
    }
    catch (err) {
      const durationMs = Math.round(performance.now() - startTime)
      const errorMessage = err instanceof Error ? err.message : 'Unknown database error'

      const result: CleanupStepResult = {
        entity: name,
        status: 'error',
        deletedCount: 0,
        durationMs,
        error: errorMessage,
      }

      logger.error(result, `Failed to cleanup ${name}`)
    }
  }

  private async cleanRevokedRefreshTokens(): Promise<number> {
    let totalDeleted = 0
    const retentionDate = dayjs().subtract(env.CLEANUP_SESSION_RETENTION_DAYS, 'days')
      .toDate()
    let hasMore = true

    while (hasMore) {
      const sessions = await prisma.userSession.findMany({
        where: {
          OR: [
            { expiresAt: { lt: retentionDate } },
            { revokedAt: { lt: retentionDate } },
          ],
        },
        select: { id: true },
        take: BATCH_SIZE,
      })

      if (sessions.length === 0) {
        hasMore = false
      }
      else {
        const deleted = await prisma.userSession.deleteMany({ where: { id: { in: sessions.map(s => s.id) } } })
        totalDeleted += deleted.count
      }
    }
    return totalDeleted
  }

  private async cleanPendingInvites(): Promise<number> {
    let totalDeleted = 0
    const retentionDate = dayjs().subtract(env.CLEANUP_INVITE_PENDING_RETENTION_DAYS, 'days')
      .toDate()
    let hasMore = true

    while (hasMore) {
      const pending = await prisma.inviteCode.findMany({
        where: {
          usedById: null,
          expiresAt: { lt: retentionDate },
        },
        select: { id: true },
        take: BATCH_SIZE,
      })

      if (pending.length === 0) {
        hasMore = false
      }
      else {
        const deleted = await prisma.inviteCode.deleteMany({ where: { id: { in: pending.map(i => i.id) } } })
        totalDeleted += deleted.count
      }
    }
    return totalDeleted
  }

  private async cleanUsedInvites(): Promise<number> {
    let totalDeleted = 0
    const retentionDate = dayjs().subtract(env.CLEANUP_INVITE_USED_RETENTION_DAYS, 'days')
      .toDate()
    let hasMore = true

    while (hasMore) {
      const used = await prisma.inviteCode.findMany({
        where: {
          usedById: { not: null },
          usedAt: { lt: retentionDate },
        },
        select: { id: true },
        take: BATCH_SIZE,
      })

      if (used.length === 0) {
        hasMore = false
      }
      else {
        const deleted = await prisma.inviteCode.deleteMany({ where: { id: { in: used.map(i => i.id) } } })
        totalDeleted += deleted.count
      }
    }
    return totalDeleted
  }

  private async cleanPasswordResetTokens(): Promise<number> {
    let totalCleaned = 0
    let hasMore = true

    while (hasMore) {
      const users = await prisma.user.findMany({
        where: { passwordResetExpiresAt: { lt: dayjs().toDate() } },
        select: { id: true },
        take: BATCH_SIZE,
      })

      if (users.length === 0) {
        hasMore = false
      }
      else {
        const updated = await prisma.user.updateMany({
          where: { id: { in: users.map(u => u.id) } },
          data: {
            passwordResetToken: null,
            passwordResetExpiresAt: null,
          },
        })
        totalCleaned += updated.count
      }
    }
    return totalCleaned
  }
}
