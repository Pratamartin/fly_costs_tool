import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globalSetup: path.resolve(__dirname, './tests/global-setup.ts'),
    fileParallelism: false,
    clearMocks: true,
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: { include: [path.resolve(__dirname, './src/routes/**')] },
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'fake-secret',
      JWT_EXPIRES_IN: '3600',
      JWT_REFRESH_SECRET: 'fake-refresh-secret',
      REFRESH_TOKEN_EXPIRES_DAYS: '7',
      SALT_ROUNDS: '2',
      LOG_LEVEL: 'debug',
      CLEANUP_ENABLED: 'true',
      CLEANUP_CRON_SCHEDULE: '0 3 * * *',
      CLEANUP_SESSION_RETENTION_DAYS: '30',
      CLEANUP_INVITE_PENDING_RETENTION_DAYS: '7',
      CLEANUP_INVITE_USED_RETENTION_DAYS: '30',
    },
  },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
})
