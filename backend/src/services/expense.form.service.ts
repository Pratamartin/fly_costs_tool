import { articleJSONSchema, articleJSONUi, eventJSONSchema, eventJSONUi } from '@/json'

export function getExpenseForm() {
  return {
    event: {
      schema: eventJSONSchema,
      ui: eventJSONUi,
    },
    article: {
      schema: articleJSONSchema,
      ui: articleJSONUi,
    },
  }
}
