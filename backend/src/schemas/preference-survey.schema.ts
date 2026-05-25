import { z } from '@hono/zod-openapi'
import { IdSchema, TimestampSchema } from './shared.schema'

export const PreferenceSurveySchema = z.object({
  id: IdSchema,
  schema: z.any(),
  ui: z.any().nullable(),
  version: z.number().int(),
  isActive: z.boolean(),
  expenseCategoryId: IdSchema,
  expenseCategory: z.object({
    name: z.string(),
    normalizedName: z.string(),
  }),
}).extend(TimestampSchema)

export const ListPreferenceSurveyResponseSchema = z.array(PreferenceSurveySchema)

export const PreferenceSurveyAnswerSchema = z.object({
  expenseCategoryId: IdSchema,
  data: z.record(z.string(), z.any()).openapi({
    description: 'Dados preenchidos no formulário da categoria.',
    example: { invoiceKey: 'formulario-preferencias/user-uuid/arquivo-anexo.pdf' },
  }),
})
