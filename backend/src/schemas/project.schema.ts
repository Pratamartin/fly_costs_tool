import { z } from '@hono/zod-openapi'
import { MAX_SUBCATEGORIES, MIN_SUBCATEGORIES } from '@/constants/project.constant'
import { dummyExpenseCategories } from '@/seeds/expense.category.seed'
import { dummyProjects } from '@/seeds/project.seed'
import { IdSchema, TimestampSchema } from './shared.schema'

const BaseSchema = z.object({
  name: z.string().min(3)
    .openapi({ examples: dummyProjects.map(p => p.name) }),

  code: z.string().openapi({
    examples: dummyProjects.map(p => p.code),
    description: 'Código único do projeto.',
  }),

  budget: z.coerce.number().positive()
    .openapi({
      example: 10000,
      description: 'Orçamento total do projeto em reais.',
    }),

  subcategories: z.array(z.string()).min(MIN_SUBCATEGORIES)
    .max(MAX_SUBCATEGORIES)
    .openapi({ example: dummyExpenseCategories.map(c => c.normalizedName) }),
})

export const CreateProjectSchema = BaseSchema

export const UpdateProjectSchema = BaseSchema.omit({ budget: true }).partial()

export const ProjectResponseSchema = z.object({ id: IdSchema })
  .extend(BaseSchema.shape)
  .extend({
    usedBudget: z.coerce.number().openapi({
      example: 0,
      description: 'Orçamento utilizado do projeto em reais.',
    }),
    isActive: z.boolean().openapi({ example: true })
      .default(true),
  })
  .extend(TimestampSchema)

export const ListProjectQuerySchema = z.object({
  isActive: z.coerce.boolean().openapi({ example: true })
    .default(true),
  search: z.string().optional()
    .openapi({
      description: 'Busca por nome ou código do projeto',
      example: 'Alpha',
    }),
}).partial()

export const ListProjectResponseSchema = z.array(ProjectResponseSchema)

export default BaseSchema
