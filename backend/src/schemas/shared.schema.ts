import { z } from '@hono/zod-openapi'

export const TimestampSchema = z.object({
  createdAt: z.coerce.date()
    .openapi({ example: '2026-02-02T12:34:56Z' }),
  updatedAt: z.coerce.date()
    .openapi({ example: '2026-02-02T12:45:00Z' }),
}).shape
