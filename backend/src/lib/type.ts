import type { OpenAPIHono, RouteConfig, RouteHandler, z } from '@hono/zod-openapi'
import type { Schema } from 'hono'
import type { PinoLogger } from 'hono-pino'
import type { ProblemDetails } from 'hono-problem-details'
import type { JwtVariables } from 'hono/jwt'
import type { ExpenseRequestStatus, UserRole } from '@/generated/prisma/enums'
import type { ValidationErrorItem } from '@/schemas/shared.schema'

export type AppAuthPayload = {
  sub: string
  role: UserRole
}

export type AppContext = {
  Variables: {
    logger: PinoLogger
    lang: string
  } & JwtVariables<AppAuthPayload>
}

/**
 * Mapeamento central de extensões de erro (RFC 9457).
 * Este é o ÚNICO lugar que você precisa alterar ao criar um erro que exige campos extras.
 */
export type AppProblemExtensions = {
  VALIDATION_ERROR: { errors: ValidationErrorItem[] }
  INTERNAL_SERVER_ERROR: { stack?: string }
  INVALID_TRANSITION: {
    resourceState: {
      current: ExpenseRequestStatus
      allowed: ExpenseRequestStatus[]
    }
  }
  UNSUPPORTED_MEDIA_TYPE: {
    allowedMimeTypes: string[]
  }
  FILE_TOO_LARGE: {
    maxSizeMB: number
  }
}

/**
 * Interface base para todos os problemas da API SGDA.
 * Garante a taxonomia de URN e a presença obrigatória do 'detail' para I18n.
 * Inclui 'schema' opcional para automação de documentação OpenAPI.
 */
export type AppProblemBase = {
  type: `urn:sgda:${string}`
  detail: string
  schema?: z.ZodObject<any>
} & ProblemDetails

/**
 * Tipo Utilitário Dinâmico.
 * Se a chave 'K' existir no mapa de extensões, ele mescla as propriedades.
 */
export type AppProblem<K extends string> = K extends keyof AppProblemExtensions
  ? AppProblemBase & AppProblemExtensions[K]
  : AppProblemBase

/**
 * Tipo para o Registry (utilizado pelo hono-problem-details).
 */
export type AppProblemDefinition = AppProblem<string>

// eslint-disable-next-line ts/no-empty-object-type
export type AppOpenAPI<S extends Schema = {}> = OpenAPIHono<AppContext, S>
export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R, AppContext>
