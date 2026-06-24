import { z } from '@hono/zod-openapi'
import { normalizeCategoryName } from '@/services/expense.category.service'
import { IdSchema, TimestampSchema } from './shared.schema'

const BaseSchema = z.object({
  id: IdSchema,
  name: z.string().openapi({ example: 'Uber' }),
  normalizedName: z.string().openapi({ example: 'uber' }),
})

export const ExpenseCategoryResponseSchema = BaseSchema.extend(TimestampSchema).openapi('ExpenseCategory')
export const ListExpenseCategoryResponseSchema = z.array(ExpenseCategoryResponseSchema).openapi('ExpenseCategoryListResponse')

export const ListExpenseCategoryQuerySchema = z.object({
  search: z.string().optional()
    .openapi({
      description: 'Search by expense subcategory name',
      example: 'passagem',
    }),
}).partial()
  .openapi('ListExpenseCategoriesQuery')

export const CreateExpenseCategorySchema = z.object({
  name: z.string().min(2)
    .trim()
    .openapi({ example: 'Uber' }),

}).openapi('CreateExpenseCategoryRequest')
  .transform((data) => {
    return {
      name: data.name,
      normalizedName: normalizeCategoryName(data.name),
    }
  })

export default BaseSchema
