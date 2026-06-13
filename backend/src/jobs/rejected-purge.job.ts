import type { Job } from 'pg-boss'
import { ExpenseRequestStatus } from '@/generated/prisma/client'
import { dayjs } from '@/lib/date'
import { BaseJob } from '@/lib/jobs'
import { logger } from '@/lib/logger'
import prisma from '@/lib/orm'
import { deleteObjects } from '@/lib/storage'

const PURGE_DAYS = 90

type PurgeStats = {
  processed: number
  filesDeleted: number
}

export class RejectedPurgeJob extends BaseJob<object, PurgeStats> {
  readonly type = 'rejected-purge' as const

  async work(_job: Job<object>): Promise<PurgeStats> {
    const cutoff = dayjs().subtract(PURGE_DAYS, 'days')
      .toDate()

    const expired = await prisma.expenseRequest.findMany({
      where: {
        status: ExpenseRequestStatus.REJEITADO,
        updatedAt: { lt: cutoff },
        purgedAt: null,
      },
      select: {
        id: true,
        attachmentKey: true,
        costBreakdowns: { select: { attachmentKey: true } },
      },
    })

    let totalFiles = 0

    for (const expense of expired) {
      const keys = [
        expense.attachmentKey,
        ...expense.costBreakdowns.map(cb => cb.attachmentKey),
      ].filter((k): k is string => k !== null)

      if (keys.length > 0) {
        await deleteObjects(keys)
        totalFiles += keys.length
      }

      await prisma.expenseRequest.update({
        where: { id: expense.id },
        data: { purgedAt: new Date() },
      })
    }

    const stats: PurgeStats = {
      processed: expired.length,
      filesDeleted: totalFiles,
    }

    logger.info(stats, `Rejected expense purge completed (${PURGE_DAYS} days cutoff)`)
    return stats
  }
}
