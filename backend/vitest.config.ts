import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globalSetup: path.resolve(__dirname, './tests/global-setup.ts'),
    fileParallelism: false,
    clearMocks: true,
    coverage: { include: [path.resolve(__dirname, './src/routes/**')] },
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'fake-secret',
      JWT_EXPIRES_IN: '3600',
      SALT_ROUNDS: '2',
      LOG_LEVEL: 'debug',
    },
  },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
})
