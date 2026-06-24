import { z } from '@hono/zod-openapi'
import { articleJSONSchema, articleJSONUi, eventJSONSchema, eventJSONUi } from '@/json'

export const EventFormSchema = z.object({
  schema: z.fromJSONSchema(eventJSONSchema as any, { defaultTarget: 'draft-7' }).openapi({
    description: eventJSONSchema.description,
    example: eventJSONSchema,
  }),
  ui: z.object().openapi({ example: eventJSONUi }),
}).openapi('EventForm')

export const ArticleFormSchema = z.object({
  schema: z.fromJSONSchema(articleJSONSchema as any, { defaultTarget: 'draft-7' }).openapi({
    description: articleJSONSchema.description,
    example: articleJSONSchema,
  }),
  ui: z.object().openapi({ example: articleJSONUi }),
}).openapi('ArticleForm')

export const FormsResponseSchema = z.object({
  event: EventFormSchema,
  article: ArticleFormSchema,
}).openapi('FormsResponse')
