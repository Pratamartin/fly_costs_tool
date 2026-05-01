import type { AppContext, AppOpenAPI } from './type'
import { OpenAPIHono } from '@hono/zod-openapi'
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

/**
 * Gera uma data ISO relativa ao "agora" para evitar que seeds e mocks expirem.
 * @param daysOffset - Dias para somar (ex: 2) ou subtrair (ex: -5).
 * @param hours - Hora do dia fixa (0-23). Padrão: 9.
 * @returns Data no padrão ISO 8601.
 */
export function getRelativeDate(daysOffset: number, hours: number = 9): string {
  const date = new Date()
  date.setDate(date.getDate() + daysOffset)
  date.setHours(hours, 0, 0, 0)
  return date.toISOString()
}
