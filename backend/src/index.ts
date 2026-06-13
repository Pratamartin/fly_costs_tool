import { serve } from '@hono/node-server'
import app from './app'
import env from './env'
import { boss, jobManager } from './jobs'
import { logger } from './lib/logger'

try {
  await jobManager.start()

  // Agenda jobs de limpeza
  if (env.CLEANUP_ENABLED) {
    await jobManager.boss.schedule('cleanup-system-data', env.CLEANUP_CRON_SCHEDULE)
    await boss.schedule('orphan-cleanup', env.CLEANUP_CRON_SCHEDULE)
    await boss.schedule('rejected-purge', env.CLEANUP_CRON_SCHEDULE)
  }

  const server = serve({
    fetch: app.fetch,
    port: env.PORT,
  }, (info) => {
    logger.info(`Server is running on ${info.address}:${info.port}`)
  })

  const shutdown = async () => {
    logger.info('Shutting down server...')
    server.close()
    await jobManager.stop()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}
catch (error) {
  logger.fatal(error, 'Failed to bootstrap application')
  process.exit(1)
}
