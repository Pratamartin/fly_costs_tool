import { boss, JobManager } from '@/lib/jobs'
import { CleanupJob } from './cleanup.job'
import { GenerateReportJob } from './generate-report.job'
import { SendEmailJob } from './send-email.job'

export const jobManager = new JobManager(boss)
  .register(new SendEmailJob(boss))
  .register(new GenerateReportJob(boss))
  .register(new CleanupJob(boss))
