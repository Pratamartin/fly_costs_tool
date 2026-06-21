import { z } from '@hono/zod-openapi'
import { MAX_SUBCATEGORIES, MIN_SUBCATEGORIES } from '@/constants/project.constant'
import { dummyExpenseCategories } from '@/seeds/expense.category.seed'
import { dummyProjects } from '@/seeds/project.seed'
import { projectPeriodCheck } from './schema.refine'
import { IdSchema, TimestampSchema } from './shared.schema'

const BaseSchema = z.object({
  name: z.string().min(3)
    .openapi({ examples: dummyProjects.map(p => p.name) }),

  code: z.string().openapi({
    examples: dummyProjects.map(p => p.code),
    description: 'Unique project code.',
  }),

  resourceSource: z.string().optional()
    .openapi({
      example: 'FAPESP',
      description: 'Funding agency or resource source.',
    }),

  startDate: z.coerce.date()
    .openapi({
      example: '2026-01-01T00:00:00Z',
      description: 'Project validity start date.',
    }),

  endDate: z.coerce.date()
    .openapi({
      example: '2027-12-31T23:59:59Z',
      description: 'Project validity end date.',
    }),

  budget: z.coerce.number().positive()
    .openapi({
      example: 10000,
      description: 'Total project budget in BRL.',
    }),

  subcategories: z.array(z.string()).min(MIN_SUBCATEGORIES)
    .max(MAX_SUBCATEGORIES)
    .openapi({ example: dummyExpenseCategories.map(c => c.normalizedName) }),
})

export const CreateProjectSchema = BaseSchema.check(projectPeriodCheck)

export const UpdateProjectSchema = BaseSchema.omit({
  budget: true,
  startDate: true,
  endDate: true,
}).partial()

export const UpdateProjectPeriodSchema = z.object({
  startDate: z.coerce.date().openapi({
    example: '2026-01-01T00:00:00Z',
    description: 'Project validity start date.',
  }),
  endDate: z.coerce.date().openapi({
    example: '2027-12-31T23:59:59Z',
    description: 'Project validity end date.',
  }),
}).check(projectPeriodCheck)

export const ProjectResponseSchema = z.object({ id: IdSchema })
  .extend(BaseSchema.shape)
  .extend({
    usedBudget: z.coerce.number().openapi({
      example: 0,
      description: 'Used project budget in BRL.',
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
      description: 'Search by project name or code',
      example: 'Alpha',
    }),
}).partial()

export const ListProjectResponseSchema = z.array(ProjectResponseSchema)

export default BaseSchema
