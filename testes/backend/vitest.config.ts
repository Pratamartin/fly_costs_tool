import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../backend/src'),
      '@/generated/prisma/client': path.resolve(__dirname, './mocks/prisma-client.ts'),
      '@/generated/prisma/enums': path.resolve(__dirname, './mocks/prisma-enums.ts'),
      '@aws-sdk/client-s3': path.resolve(__dirname, './mocks/aws-s3-client.ts'),
      /** Evita falha de resolução em alguns ambientes CI (subpath @/lib/...). */
      '@/lib/storage': path.resolve(__dirname, '../../backend/src/lib/storage.ts'),
    },
  },
})
