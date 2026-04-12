import type { OpenAPIHono, RouteConfig, RouteHandler } from '@hono/zod-openapi'
import type { Schema } from 'hono'
import type { PinoLogger } from 'hono-pino'
import type { JwtVariables } from 'hono/jwt'
import type { UserRole } from '@/generated/prisma/enums'

export type AppAuthPayload = {
  sub: string
  role: UserRole
}

export type AppContext = {
  Variables: {
    logger: PinoLogger
  } & JwtVariables<AppAuthPayload>
}

// eslint-disable-next-line ts/no-empty-object-type
export type AppOpenAPI<S extends Schema = {}> = OpenAPIHono<AppContext, S>
export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R, AppContext>
