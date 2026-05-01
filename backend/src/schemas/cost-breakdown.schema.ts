import { z } from '@hono/zod-openapi'
import { dummyExpenseCategories } from '@/seeds/expense.category.seed'
import { normalizeCategoryName } from '@/services/expense.category.service'
import ExpenseCategoryBaseSchema from './expense.category.schema'
import { IdSchema } from './shared.schema'

const BaseSchema = z.object({
  id: IdSchema,
  subcategoryName: z.string().transform(val => normalizeCategoryName(val))
    .openapi({
      description: 'Nome da subcategoria de despesa',
      example: dummyExpenseCategories.at(0)?.normalizedName,
    }),
  amount: z.number().positive()
    .openapi({ example: 150.50 }),
})

export const CreateCostBreakdownSchema = BaseSchema.omit({ id: true })

export const CostBreakdownResponseSchema = z.object({
  id: IdSchema,
  expenseRequestId: IdSchema,
  amount: z.coerce.number()
    .openapi({ example: 150.50 }),
  subcategory: ExpenseCategoryBaseSchema,
})
