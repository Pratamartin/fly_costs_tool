import { defineConfig, env } from 'prisma/config'
import 'dotenv/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: env('NODE_ENV') === 'production' ? 'node src/seed.js' : 'tsx src/seed.ts',
  },
  datasource: { url: env('DATABASE_URL') },
})
