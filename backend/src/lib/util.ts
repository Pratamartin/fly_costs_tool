import type { AppContext, AppOpenAPI } from './type'
import { OpenAPIHono, z } from '@hono/zod-openapi'
import { defaultHook } from 'stoker/openapi'

export function createRouter() {
  return new OpenAPIHono<AppContext>({
    defaultHook, // Estrutura de Resposta padrão para erros de validação Zod (422).
    strict: false, // Flexibilidade quanto ao trailing slash --> 'endpoint/' == 'endpoint'.
  })
}

export function registerRoutes(app: AppOpenAPI, routes: ReturnType<typeof createRouter>[]) {
  routes.forEach((router) => {
    app.route('/', router)
  })

  return app
}

export function multipartFormContentRequired<
  T extends z.ZodSchema | z.ZodUnion | z.ZodAny | z.ZodArray<z.ZodAny>,
>(schema: T, description: string) {
  return {
    content: { 'multipart/form-data': { schema } },
    description,
    required: true,
  }
}

export function sseContent<
  T extends z.ZodTypeAny,
  E extends z.ZodTypeAny = z.ZodString,
>(
  dataSchema: T,
  description: string,
  eventSchema: E = z.string() as unknown as E,
) {
  return {
    content: {
      'text/event-stream': {
        schema: z.object({
          event: eventSchema.openapi({ description: 'Nome do evento SSE' }),
          data: dataSchema.openapi({ description: 'Payload JSON do evento' }),
        }),
      },
    },
    description,
  }
}

export function getRelativeDate(daysOffset: number, hours: number = 9): string {
  const date = new Date()
  date.setDate(date.getDate() + daysOffset)
  date.setHours(hours, 0, 0, 0)
  return date.toISOString()
}
