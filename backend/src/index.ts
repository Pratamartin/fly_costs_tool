import { serve } from '@hono/node-server'
import app from './app'
import env from './env'

const server = serve({
  fetch: app.fetch,
  port: env.PORT,
}, (info) => {
  // eslint-disable-next-line no-console
  console.log(`Server is running on ${info.address}:${info.port}`)
})

// graceful shutdown
process.on('SIGINT', () => {
  server.close()
  process.exit(0)
})
process.on('SIGTERM', () => {
  server.close((err) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    process.exit(0)
  })
})
