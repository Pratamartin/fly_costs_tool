import type { OpenAPIHono, RouteConfig, RouteHandler } from '@hono/zod-openapi'
import type { Schema } from 'hono'
import type { PinoLogger } from 'hono-pino'

// Variáveis úteis na camada controller.
export type AppContext = {
  Variables: {
    logger: PinoLogger // Acesso através de 'c.get('logger')'.
  }
}

// eslint-disable-next-line ts/no-empty-object-type
export type AppOpenAPI<S extends Schema = {}> = OpenAPIHono<AppContext, S>
export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R, AppContext>
