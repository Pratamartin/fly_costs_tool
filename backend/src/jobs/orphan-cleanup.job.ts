import type { Job } from 'pg-boss'
import { ListObjectsV2Command } from '@aws-sdk/client-s3'
import env from '@/env'
import { BaseJob } from '@/lib/jobs'
import { logger } from '@/lib/logger'
import prisma from '@/lib/orm'
import { deleteObjects, getClient } from '@/lib/storage'

type CleanupStats = {
  orphanDbRefs: number
  orphanR2Objs: number
  dbKeysChecked: number
  r2KeysChecked: number
}

export class OrphanCleanupJob extends BaseJob<object, CleanupStats> {
  readonly type = 'orphan-cleanup' as const

  async work(_job: Job<object>): Promise<CleanupStats> {
    logger.info('Starting orphan cleanup...')

    // 1. Coleciona todas as attachmentKeys do banco
    const [expenseKeys, breakdownKeys] = await Promise.all([
      prisma.expenseRequest.findMany({
        where: { attachmentKey: { not: null } },
        select: {
          id: true,
          attachmentKey: true,
        },
      }),
      prisma.costBreakdown.findMany({
        where: { attachmentKey: { not: null } },
        select: {
          id: true,
          attachmentKey: true,
        },
      }),
    ])

    const dbKeyMap = new Map<string, { entity: 'expense' | 'breakdown', id: string }>()
    for (const e of expenseKeys) {
      if (e.attachmentKey) {
        dbKeyMap.set(e.attachmentKey, {
          entity: 'expense',
          id: e.id,
        })
      }
    }
    for (const cb of breakdownKeys) {
      if (cb.attachmentKey) {
        dbKeyMap.set(cb.attachmentKey, {
          entity: 'breakdown',
          id: cb.id,
        })
      }
    }

    // 2. Lista todos os objetos do bucket R2 (paginação)
    const r2Keys = new Set<string>()
    let continuationToken: string | undefined

    do {
      const response = await getClient().send(new ListObjectsV2Command({
        Bucket: env.R2_BUCKET_NAME!,
        ContinuationToken: continuationToken,
      }))

      if (response.Contents) {
        for (const obj of response.Contents) {
          if (obj.Key)
            r2Keys.add(obj.Key)
        }
      }

      continuationToken = response.NextContinuationToken
    } while (continuationToken)

    // 3. Detecta referências órfãs no banco (DB aponta para key que não existe no R2)
    const orphanDbEntries: { key: string, entity: 'expense' | 'breakdown', id: string }[] = []
    for (const [key, ref] of dbKeyMap) {
      if (!r2Keys.has(key)) {
        orphanDbEntries.push({
          key,
          ...ref,
        })
      }
    }

    // 4. Detecta objetos órfãos no R2 (existem no bucket mas não no banco)
    const orphanR2Keys: string[] = []
    for (const key of r2Keys) {
      if (!dbKeyMap.has(key)) {
        orphanR2Keys.push(key)
      }
    }

    // 5. Ação: limpa refs órfãs no banco
    if (orphanDbEntries.length > 0) {
      const expenseIds = orphanDbEntries
        .filter(e => e.entity === 'expense')
        .map(e => e.id)
      const breakdownIds = orphanDbEntries
        .filter(e => e.entity === 'breakdown')
        .map(e => e.id)

      await Promise.all([
        expenseIds.length > 0
          ? prisma.expenseRequest.updateMany({
              where: { id: { in: expenseIds } },
              data: { attachmentKey: null },
            })
          : Promise.resolve(),
        breakdownIds.length > 0
          ? prisma.costBreakdown.updateMany({
              where: { id: { in: breakdownIds } },
              data: { attachmentKey: null },
            })
          : Promise.resolve(),
      ])

      logger.warn({ count: orphanDbEntries.length }, 'Orphan DB references cleared')
    }

    // 6. Ação: deleta objetos órfãos do R2
    if (orphanR2Keys.length > 0) {
      await deleteObjects(orphanR2Keys)
      logger.warn({ count: orphanR2Keys.length }, 'Orphan R2 objects deleted')
    }

    const stats: CleanupStats = {
      orphanDbRefs: orphanDbEntries.length,
      orphanR2Objs: orphanR2Keys.length,
      dbKeysChecked: dbKeyMap.size,
      r2KeysChecked: r2Keys.size,
    }

    logger.info(stats, 'Orphan cleanup completed')
    return stats
  }
}
