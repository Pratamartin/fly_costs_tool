/* eslint-disable node/no-process-env */
import { config } from 'dotenv'
import { expand } from 'dotenv-expand'
import { z } from 'zod'

expand(config())

const EnvSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(3001),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.coerce.number(),
  SALT_ROUNDS: z.coerce.number().default(10),
  ALLOWED_ORIGINS: z.string()
    .transform(str => str.split(','))
    .pipe(z.array(z.url()))
    .default(['http://localhost:3000']),
  DATABASE_URL: z.url(),
  /** Cloudflare R2 (S3-compatible). Opcional em testes; obrigatório para upload/download de memorando. */
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_ENDPOINT: z.url().optional(),
  R2_BUCKET_NAME: z.string().optional(),
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
