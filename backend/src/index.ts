import { serve } from '@hono/node-server'
import app from './app'
import { setupEmailWorker } from './email/worker'
import env from './env'
import { logger } from './lib/logger'

const emailWorker = setupEmailWorker()

const server = serve({
  fetch: app.fetch,
  port: env.PORT,
}, (info) => {
  logger.info(`Server is running on ${info.address}:${info.port}`)
})

// graceful shutdown
async function shutdown() {
  logger.info('Shutting down server...')

  server.close()

  if (emailWorker) {
    logger.info('Closing email worker...')
    await emailWorker.close()
  }

  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
