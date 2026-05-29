import type { Job, JobWithMetadata, SendOptions, WorkOptions } from 'pg-boss'
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

export abstract class BaseJob<TData extends object = object, TOutput = unknown> {
  abstract readonly type: string

  readonly options: SendOptions = {
    retryLimit: 3,
    retryDelay: 1000,
  }

  readonly workOptions?: WorkOptions

  constructor(protected boss: PgBoss) {}

  async start(): Promise<void> {
    await this.boss.work(this.type, this.workOptions ?? {}, async (jobs) => {
      const results = await Promise.all(jobs.map(job => this.work(job as Job<TData>)))
      return jobs.length === 1 ? results[0] : results
    })
  }

  abstract work(job: Job<TData>): Promise<TOutput>

  async emit(data: TData, options?: EmitOptions): Promise<void> {
    const { tx, ...sendOptions } = options || {}

    await this.boss.send(this.type, data, {
      ...this.options,
      ...sendOptions,
      ...(tx ? { db: fromPrisma(tx) } : {}),
    })
  }
}

export class JobManager<TMapping extends Record<string, { req: any, res: any }> = Record<string, never>> {
  private jobsMap = new Map<string, BaseJob<any, any>>()

  constructor(public readonly boss: PgBoss) {}

  register<TType extends string, TData extends object, TOutput>(
    job: BaseJob<TData, TOutput> & { type: TType },
  ): JobManager<TMapping & { [K in TType]: { req: TData, res: TOutput } }> {
    this.jobsMap.set(job.type, job)
    return this as any
  }

  getWorker<K extends keyof TMapping & string>(
    type: K,
  ): BaseJob<TMapping[K]['req'], TMapping[K]['res']> {
    const worker = this.jobsMap.get(type)
    if (!worker) {
      throw new Error(`Worker for job type "${type}" not found.`)
    }
    return worker as BaseJob<TMapping[K]['req'], TMapping[K]['res']>
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
    data: TMapping[K]['req'],
    options?: EmitOptions,
  ): Promise<void> {
    const job = this.jobsMap.get(type)
    if (!job) {
      throw new Error(`Job ${type} not registered`)
    }
    await job.emit(data, options)
  }

  async getJob<K extends keyof TMapping & string>(
    type: K,
    jobId: string,
  ): Promise<(JobWithMetadata<TMapping[K]['req']> & { output: TMapping[K]['res'] | null }) | null> {
    const [job] = await this.boss.findJobs<TMapping[K]['req']>(type, { id: jobId })
    return (job as any) || null
  }

  async completeJob<K extends keyof TMapping & string>(
    type: K,
    jobId: string,
    data: TMapping[K]['res'],
  ): Promise<void> {
    await this.boss.complete(type, jobId, data as object)
  }
}
