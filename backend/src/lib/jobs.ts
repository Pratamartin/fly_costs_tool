import type { Job, SendOptions, WorkOptions } from 'pg-boss'
import type { Prisma } from '@/generated/prisma/client'
import { fromPrisma, PgBoss } from 'pg-boss'
import env from '@/env'
import { logger } from './logger'

export const boss = new PgBoss({
  connectionString: env.DATABASE_URL,
  __test__enableSpies: env.NODE_ENV === 'test',
  persistWarnings: true,
  warningRetentionDays: 7,
})

boss.on('error', (error) => {
  logger.error({ error }, 'pg-boss internal error')
})

boss.on('warning', (warning) => {
  logger.warn({ warning }, 'pg-boss warning')
})

export type EmitOptions = SendOptions & { tx?: Prisma.TransactionClient }

export abstract class BaseJob<T extends object = object> {
  abstract readonly type: string

  readonly options: SendOptions = {
    retryLimit: 3,
    retryDelay: 1000,
  }

  readonly workOptions?: WorkOptions

  constructor(protected boss: PgBoss) {}

  async start(): Promise<void> {
    await this.boss.work(this.type, this.workOptions ?? {}, async (jobs) => {
      const jobArray = Array.isArray(jobs) ? jobs : [jobs]
      for (const job of jobArray) {
        await this.work(job as Job<T>)
      }
    })
  }

  abstract work(job: Job<T>): Promise<void>

  async emit(data: T, options?: EmitOptions): Promise<void> {
    const { tx, ...sendOptions } = options || {}

    await this.boss.send(this.type, data, {
      ...this.options,
      ...sendOptions,
      ...(tx ? { db: fromPrisma(tx) } : {}),
    })
  }
}

export class JobManager<TMapping extends Record<string, any> = Record<string, never>> {
  private jobsMap = new Map<string, BaseJob<any>>()

  constructor(public readonly boss: PgBoss) {}

  register<TType extends string, TData extends object>(
    job: BaseJob<TData> & { type: TType },
  ): JobManager<TMapping & { [K in TType]: TData }> {
    this.jobsMap.set(job.type, job)
    return this as any
  }

  async start(): Promise<void> {
    await this.boss.start()
    for (const job of this.jobsMap.values()) {
      await this.boss.createQueue(job.type)
      await job.start()
    }
  }

  async stop(): Promise<void> {
    await this.boss.stop()
  }

  async emit<K extends keyof TMapping & string>(
    type: K,
    data: TMapping[K],
    options?: EmitOptions,
  ): Promise<void> {
    const job = this.jobsMap.get(type)
    if (!job) {
      throw new Error(`Job ${type} not registered`)
    }
    await job.emit(data, options)
  }
}
