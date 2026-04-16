import { z } from '@hono/zod-openapi'
import { ExpenseTopic } from '@/generated/prisma/enums'

const BaseSchema = z.object({
  name: z.string().openapi({ example: 'Laboratório de Robótica' }),

  code: z.string().optional()
    .openapi({
      example: 'LAB-ROB-001',
      description: 'Código único do projeto (opcional).',
    }),

  budget: z.number().openapi({
    example: 10000,
    description: 'Orçamento total do projeto em reais.',
  }),

  expenseTopics: z.array(z.enum(ExpenseTopic)).openapi({ example: Object.values(ExpenseTopic) }),
})

export default BaseSchema
