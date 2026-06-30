import type { OpenAPIHono, RouteConfig, RouteHandler, z } from '@hono/zod-openapi'
import type { Schema } from 'hono'
import type { PinoLogger } from 'hono-pino'
import type { ProblemDetails } from 'hono-problem-details'
import type { JwtVariables } from 'hono/jwt'
import type { ExpenseRequestStatus, UserRole } from '@/generated/prisma/enums'
import type { FileUploadErrorSchema, InvalidSubcategoriesSchema, InviteAlreadyExpiredSchema, InviteAlreadyUsedSchema, ProjectInsufficientFundsSchema, ProjectPeriodExpiredSchema, ProjectShrinkageConflictSchema, ValidationErrorItem } from '@/schemas/shared.schema'

export type AppAuthPayload = {
  sub: string
  role: UserRole
  jti?: string
}

export type AppContext = {
  Variables: {
    logger: PinoLogger
    lang: string
    paginationMeta?: {
      total: number
      limit: number
      offset: number
    }
  } & JwtVariables<AppAuthPayload>
}

/**
 * Mapeamento central de extensões de erro (RFC 9457).
 * Este é o ÚNICO lugar que você precisa alterar ao criar um erro que exige campos extras.
 */
export type AppProblemExtensions = {
  VALIDATION_ERROR: { errors: ValidationErrorItem[] }
  INTERNAL_SERVER_ERROR: { stack?: string }
  INVITE_ALREADY_USED: z.infer<typeof InviteAlreadyUsedSchema>
  INVITE_ALREADY_EXPIRED: z.infer<typeof InviteAlreadyExpiredSchema>
  PROJECT_INSUFFICIENT_FUNDS: z.infer<typeof ProjectInsufficientFundsSchema>
  INVALID_SUBCATEGORIES: z.infer<typeof InvalidSubcategoriesSchema>
  INVALID_TRANSITION: {
    resourceState: {
      current: ExpenseRequestStatus
      allowed: ExpenseRequestStatus[]
    }
  }
  UNSUPPORTED_MEDIA_TYPE: z.infer<typeof FileUploadErrorSchema>
  FILE_TOO_LARGE: z.infer<typeof FileUploadErrorSchema>
  PROJECT_PERIOD_EXPIRED: z.infer<typeof ProjectPeriodExpiredSchema>
  PROJECT_SHRINKAGE_CONFLICT: z.infer<typeof ProjectShrinkageConflictSchema>
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
