/* eslint-disable node/no-process-env */
import path from 'node:path'
import { config } from 'dotenv'
import { expand } from 'dotenv-expand'
import { z } from 'zod'

expand(config({ path: path.resolve(process.cwd(), process.env.NODE_ENV === 'test' ? '.env.test.local' : '.env') }))

const EnvSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(3001),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  SALT_ROUNDS: z.coerce.number().default(10),
  ALLOWED_ORIGINS: z.string()
    .transform(str => str.split(','))
    .pipe(z.array(z.url())),
  DATABASE_URL: z.url(),
})

export type Env = z.infer<typeof EnvSchema>

function parseEnv(): Env {
  const { data, error } = EnvSchema.safeParse(process.env)

  if (error) {
    const errorMessage = `❌ Invalid env:\n${Object.entries(error.flatten().fieldErrors).map(([k, v]) => `  - ${k}: ${v?.map(m => m.replace('Invalid input: ', '')).join(', ')}`)
      .join('\n')}`
    console.error(errorMessage)
    process.exit(1)
  }

  return data
}

export default parseEnv()
