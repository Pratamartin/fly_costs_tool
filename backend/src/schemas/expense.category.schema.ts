import { z } from '@hono/zod-openapi'
import { normalizeCategoryName } from '@/services/expense.category.service'
import { IdSchema, TimestampSchema } from './shared.schema'

const BaseSchema = z.object({
  id: IdSchema,
  name: z.string().openapi({ example: 'Uber' }),
  normalizedName: z.string().openapi({ example: 'uber' }),
})

export const ExpenseCategoryResponseSchema = BaseSchema.extend(TimestampSchema)
export const ListExpenseCategoryResponseSchema = z.array(ExpenseCategoryResponseSchema)

export const ListExpenseCategoryQuerySchema = z.object({
  search: z.string().optional()
    .openapi({
      description: 'Busca por nome da subcategoria de despesa',
      example: 'passagem',
    }),
}).partial()

export const CreateExpenseCategorySchema = z.object({
  name: z.string().min(2)
    .trim()
    .openapi({ example: 'Uber' }),

}).transform((data) => {
  return {
    name: data.name,
    normalizedName: normalizeCategoryName(data.name),
  }
})
