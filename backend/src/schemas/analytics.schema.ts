import { z } from '@hono/zod-openapi'
import { DEFAULT_TOP_PROJECTS_COUNT } from '@/constants/analytics.constant'
import { IdSchema } from './shared.schema'

export const AdminDashboardResponseSchema = z.object({
  totalRequests: z.number().int()
    .nonnegative()
    .openapi({ example: 120 }),
  byStatus: z.record(z.string(), z.number().int()
    .nonnegative()).openapi({
    example: {
      PENDENTE: 34,
      APROVADO: 58,
      REJEITADO: 12,
      EM_PROCESSAMENTO: 16,
    },
  }),
  totalValue: z.string()
    .openapi({ example: '23450.72' }),
  budgetCommitted: z.string()
    .openapi({ example: '11230.50' }),
})

export const TopProjectsQuerySchema = z.object({ limit: z.coerce.number().default(DEFAULT_TOP_PROJECTS_COUNT) }).partial()

export const TopProjectSchema = z.object({
  id: IdSchema,
  name: z.string().openapi({ example: 'Sustainability Project' }),
  allocationsCount: z.number().int()
    .nonnegative()
    .openapi({ example: 18 }),
  totalValue: z.string()
    .openapi({ example: '7800.45' }),
})

export const TopProjectsResponseSchema = z.array(TopProjectSchema)
