import { pinoLogger } from 'hono-pino'
import { logger } from '@/lib/logger'

export default pinoLogger({ pino: logger })
