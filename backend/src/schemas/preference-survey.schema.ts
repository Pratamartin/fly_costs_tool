import { z } from '@hono/zod-openapi'
import { preferenceSurveyJSONSchema, preferenceSurveyJSONUi } from '@/json'
import { IdSchema, TimestampSchema } from './shared.schema'

export const DynamicSurveyDataSchema = z.record(z.string(), z.any()).openapi({
  description: 'Dynamic JSON payload containing the form answers. Structure depends on the expense category.',
  oneOf: [
    preferenceSurveyJSONSchema.definitions.diarias as any,
    preferenceSurveyJSONSchema.definitions.inscricao as any,
    preferenceSurveyJSONSchema.definitions['passagem-aerea'] as any,
  ],
})

export const PreferenceSurveySchema = z.object({
  id: IdSchema,
  schema: z.fromJSONSchema(preferenceSurveyJSONSchema as any, { defaultTarget: 'draft-7' }).openapi({ example: preferenceSurveyJSONSchema.definitions['passagem-aerea'] }),
  ui: z.any().nullable()
    .openapi({ example: preferenceSurveyJSONUi['passagem-aerea'] }),
  version: z.number().int()
    .openapi({ example: 1 }),
  isActive: z.boolean().openapi({ example: true }),
  expenseCategoryId: IdSchema,
  expenseCategory: z.object({
    name: z.string().openapi({ example: 'Inscrição' }),
    normalizedName: z.string().openapi({ example: 'inscricao' }),
  }),
}).extend(TimestampSchema)

export const ListPreferenceSurveyResponseSchema = z.array(PreferenceSurveySchema)

export const PreferenceSurveyAnswerSchema = z.object({
  expenseCategoryId: IdSchema,
  data: DynamicSurveyDataSchema,
})
