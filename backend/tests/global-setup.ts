/* eslint-disable no-console */
/* eslint-disable node/no-process-env */
import { execSync } from 'node:child_process'
import { PostgreSqlContainer } from '@testcontainers/postgresql'

export default async function () {
  const postgres = await new PostgreSqlContainer('postgres:18-alpine').withReuse()
    .start()
  const postgresUri = postgres.getConnectionUri()

  process.env.DATABASE_URL = postgresUri

  runMigrations()

  return async () => {
    await postgres.stop()
  }
}

function runMigrations() {
  console.log('🏗️  Running migrations...')
  execSync('npx prisma migrate deploy', {
    env: process.env,
    stdio: 'inherit',
  })
}
