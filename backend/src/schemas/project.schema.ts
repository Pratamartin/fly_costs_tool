import { z } from '@hono/zod-openapi'
import { dummyExpenseCategories } from '@/seeds/expense.category.seed'
import { dummyProjects } from '@/seeds/project.seed'

const BaseSchema = z.object({
  name: z.string().openapi({ examples: dummyProjects.map(p => p.name) }),

  code: z.string()
    .openapi({
      examples: dummyProjects.map(p => p.code),
      description: 'Código único do projeto.',
    }),

  budget: z.number().openapi({
    example: 10000,
    description: 'Orçamento total do projeto em reais.',
  }),

  subcategories: z.array(z.string()).openapi({ example: dummyExpenseCategories.map(c => c.normalizedName) }),
})

export default BaseSchema
