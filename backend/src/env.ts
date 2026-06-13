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
  JWT_REFRESH_SECRET: z.string(),
  REFRESH_TOKEN_EXPIRES_DAYS: z.coerce.number().default(14),
  SALT_ROUNDS: z.coerce.number().default(10),
  COOKIE_SAME_SITE: z.enum(['Strict', 'Lax', 'None']).default('Lax'),
  ALLOWED_ORIGINS: z.string()
    .transform(str => str.split(','))
    .pipe(z.array(z.url()))
    .default(['http://localhost:3000']),
  DATABASE_URL: z.url(),
  FRONTEND_URL: z.url()
    .default('http://localhost:3000'),
  /** Cloudflare R2 (S3-compatible). Opcional em testes; obrigatório para upload/download de memorando. */
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_ENDPOINT: z.url().optional(),
  R2_BUCKET_NAME: z.string().optional(),

  CLEANUP_ENABLED: z.coerce.boolean().default(true),
  CLEANUP_CRON_SCHEDULE: z.string().default('0 3 * * *'),
  CLEANUP_SESSION_RETENTION_DAYS: z.coerce.number().default(30),
  CLEANUP_INVITE_PENDING_RETENTION_DAYS: z.coerce.number().default(7),
  CLEANUP_INVITE_USED_RETENTION_DAYS: z.coerce.number().default(30),

  /** Email Service. Opcional em testes; obrigatório para envio de notificações por email */
  GOOGLE_EMAIL: z.email()
    .optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REFRESH_TOKEN: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.url().optional(),
}).superRefine((input, ctx) => {
  if (input.NODE_ENV === 'production') {
    const emailFields = [
      'GOOGLE_EMAIL',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'GOOGLE_REFRESH_TOKEN',
      'GOOGLE_REDIRECT_URI',
    ] as const

    emailFields.forEach((field) => {
      if (!input[field]) {
        ctx.addIssue({
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: [field],
          message: `Must be present when NODE_ENV is 'production'`,
        })
      }
    })
  }
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
