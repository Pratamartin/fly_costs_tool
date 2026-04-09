import { pinoLogger } from 'hono-pino'
import env from '@/env'

export default pinoLogger({
  pino: {
    level: env.LOG_LEVEL,
    transport: env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  },
})
