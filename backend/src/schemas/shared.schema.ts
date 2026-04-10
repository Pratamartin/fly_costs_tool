import { z } from '@hono/zod-openapi'

export const TimestampSchema = z.object({
  createdAt: z.iso.datetime()
    .openapi({ example: '2026-02-02T12:34:56Z' }),
  updatedAt: z.iso.datetime()
    .openapi({ example: '2026-02-02T12:45:00Z' }),
}).shape
