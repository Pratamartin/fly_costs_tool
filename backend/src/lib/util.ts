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
