import { boss, JobManager } from '@/lib/jobs'
import { SendEmailJob } from './send-email.job'

export const jobManager = new JobManager(boss)
  .register(new SendEmailJob(boss))
