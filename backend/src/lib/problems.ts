import type { AppProblem, AppProblemDefinition, AppProblemExtensions } from './type'
import { z } from '@hono/zod-openapi'
import { createProblemTypeRegistry } from 'hono-problem-details'
import { createProblemDetailsSchema } from 'hono-problem-details/openapi'
import { ExpenseRequestStatus } from '@/generated/prisma/enums'
import { createResourceStateSchema, FileUploadErrorSchema, ValidationErrorItemSchema } from '@/schemas/shared.schema'

export const PROBLEM_DEFINITIONS = {
  // --- AUTH & SECURITY ---
  UNAUTHORIZED: {
    status: 401,
    title: 'Unauthorized',
    type: 'urn:sgda:auth:security:unauthorized',
    detail: 'Access denied. You must be authenticated to continue.',
  },
  INVALID_CREDENTIALS: {
    status: 401,
    title: 'Invalid credentials',
    type: 'urn:sgda:auth:security:invalid-credentials',
    detail: 'The email or password provided is incorrect.',
  },
  FORBIDDEN: {
    status: 403,
    title: 'Forbidden',
    type: 'urn:sgda:auth:security:forbidden',
    detail: 'Access denied. You do not have permission to access this resource.',
  },
  INVALID_TOKEN: {
    status: 400,
    title: 'Invalid or expired token',
    type: 'urn:sgda:auth:token:invalid',
    detail: 'The security token provided is invalid or has expired.',
  },

  // --- USER DOMAIN ---
  USER_NOT_FOUND: {
    status: 404,
    title: 'User not found',
    type: 'urn:sgda:domain:user:not-found',
    detail: 'The requested user could not be found.',
  },
  EMAIL_ALREADY_EXISTS: {
    status: 409,
    title: 'Email already exists',
    type: 'urn:sgda:domain:user:email-conflict',
    detail: 'The provided email is already registered.',
  },
  CPF_CONFLICT: {
    status: 409,
    title: 'CPF conflict',
    type: 'urn:sgda:domain:user:cpf-conflict',
    detail: 'The provided CPF is already registered.',
  },
  PROFILE_NOT_ALLOWED: {
    status: 403,
    title: 'Profile not allowed',
    type: 'urn:sgda:domain:user:profile-not-allowed',
    detail: 'This user role is not permitted to have a beneficiary profile.',
  },

  // --- INVITE DOMAIN ---
  INVALID_INVITE_CODE: {
    status: 400,
    title: 'Invalid invite code',
    type: 'urn:sgda:domain:invite:invalid-code',
    detail: 'The invite code provided is invalid or has expired.',
  },
  INVITE_ALREADY_USED: {
    status: 409,
    title: 'Invite already used',
    type: 'urn:sgda:domain:invite:already-used',
    detail: 'Cannot revoke or use an invite that has already been used.',
  },
  INVITE_ALREADY_EXPIRED: {
    status: 409,
    title: 'Invite already expired',
    type: 'urn:sgda:domain:invite:already-expired',
    detail: 'This invite has already expired.',
  },
  INVITE_CONFLICT: {
    status: 409,
    title: 'Invite conflict',
    type: 'urn:sgda:domain:invite:conflict',
    detail: 'Cannot revoke or use this invite due to its current state (used or expired).',
  },
  INVITE_NOT_FOUND: {
    status: 404,
    title: 'Invite not found',
    type: 'urn:sgda:domain:invite:not-found',
    detail: 'The requested invite could not be found.',
  },

  // --- EXPENSE DOMAIN ---
  EXPENSE_NOT_FOUND: {
    status: 404,
    title: 'Expense not found',
    type: 'urn:sgda:domain:expense:not-found',
    detail: 'The requested expense could not be found.',
  },
  COST_BREAKDOWN_NOT_FOUND: {
    status: 404,
    title: 'Cost breakdown not found',
    type: 'urn:sgda:domain:expense:breakdown-not-found',
    detail: 'The specific cost breakdown could not be found or does not belong to this expense.',
  },
  RECEIPT_NOT_FOUND: {
    status: 404,
    title: 'Receipt not found',
    type: 'urn:sgda:domain:expense:receipt-not-found',
    detail: 'The requested receipt/proof of payment has not been uploaded for this breakdown.',
  },
  INVALID_EXPENSE_STATE: {
    status: 409,
    title: 'Invalid state or transition',
    type: 'urn:sgda:domain:expense:invalid-state',
    detail: 'The action cannot be performed in the current state of the expense.',
  },
  INVALID_TRANSITION: {
    status: 409,
    title: 'Invalid status transition',
    type: 'urn:sgda:domain:expense:invalid-transition',
    detail: 'The requested status change violates business rules.',
    schema: createResourceStateSchema(z.nativeEnum(ExpenseRequestStatus)),
  },
  MISSING_MEMO: {
    status: 400,
    title: 'Missing memo',
    type: 'urn:sgda:domain:expense:missing-memo',
    detail: 'A memorandum is required to proceed with this action.',
  },
  MISSING_REASON: {
    status: 400,
    title: 'Reason required',
    type: 'urn:sgda:domain:expense:reason-required',
    detail: 'A justification/reason is required for this action.',
  },
  MISSING_BREAKDOWNS: {
    status: 400,
    title: 'No costs registered',
    type: 'urn:sgda:domain:expense:missing-breakdowns',
    detail: 'The request does not have any cost breakdowns registered.',
  },
  MISSING_RECEIPTS: {
    status: 400,
    title: 'Missing receipts',
    type: 'urn:sgda:domain:expense:missing-receipts',
    detail: 'There are cost breakdowns without an attached receipt.',
  },
  PENDING_ISSUES: {
    status: 400,
    title: 'Pending issues found',
    type: 'urn:sgda:domain:expense:pending-issues',
    detail: 'There are pending issues that must be resolved first.',
  },

  // --- PROJECT DOMAIN ---
  PROJECT_NOT_FOUND: {
    status: 404,
    title: 'Project not found',
    type: 'urn:sgda:domain:project:not-found',
    detail: 'The requested project could not be found.',
  },
  PROJECT_CODE_IN_USE: {
    status: 409,
    title: 'Project code already in use',
    type: 'urn:sgda:domain:project:code-conflict',
    detail: 'The project code is already in use by another project.',
  },
  PROJECT_ARCHIVED: {
    status: 409,
    title: 'Project is archived',
    type: 'urn:sgda:domain:project:archived',
    detail: 'This project is archived and cannot be edited or linked.',
  },
  PROJECT_INSUFFICIENT_FUNDS: {
    status: 409,
    title: 'Insufficient project funds',
    type: 'urn:sgda:domain:project:insufficient-funds',
    detail: 'Project does not have sufficient budget for this breakdown.',
  },
  INVALID_SUBCATEGORIES: {
    status: 400,
    title: 'Invalid subcategories',
    type: 'urn:sgda:domain:project:invalid-subcategories',
    detail: 'One or more subcategories provided are invalid for this project.',
  },

  // --- NOTIFICATIONS ---
  NOTIFICATION_NOT_FOUND: {
    status: 404,
    title: 'Notification not found',
    type: 'urn:sgda:domain:notification:not-found',
    detail: 'The requested notification could not be found.',
  },

  // --- STORAGE & FILES ---
  INVALID_FILE: {
    status: 400,
    title: 'Invalid file',
    type: 'urn:sgda:infra:file:invalid',
    detail: 'The uploaded file is invalid or does not meet the requirements.',
  },
  FILE_TOO_LARGE: {
    status: 413,
    title: 'File too large',
    type: 'urn:sgda:infra:file:too-large',
    detail: 'The uploaded file exceeds the maximum allowed size.',
    schema: FileUploadErrorSchema.pick({ maxSizeMB: true }),
  },
  UNSUPPORTED_MEDIA_TYPE: {
    status: 415,
    title: 'Unsupported media type',
    type: 'urn:sgda:infra:file:unsupported-format',
    detail: 'The provided file format is not supported for this action.',
    schema: FileUploadErrorSchema.pick({ allowedMimeTypes: true }),
  },
  STORAGE_UNAVAILABLE: {
    status: 503,
    title: 'Storage unavailable',
    type: 'urn:sgda:infra:storage:unavailable',
    detail: 'The file storage service is currently unavailable.',
  },
  STORAGE_PROVIDER_ERROR: {
    status: 502,
    title: 'Storage provider error',
    type: 'urn:sgda:infra:storage:provider-error',
    detail: 'An unexpected error occurred with the storage provider.',
  },

  // --- VALIDATION ---
  VALIDATION_ERROR: {
    status: 422,
    title: 'Validation Error',
    type: 'urn:sgda:validation:request:failed',
    detail: 'The request failed data validation.',
    schema: z.object({ errors: z.array(ValidationErrorItemSchema).openapi({ description: 'List of validation errors captured by the Zod hook.' }) }),
  },

  // --- SYSTEM & INFRASTRUCTURE ---
  INTERNAL_SERVER_ERROR: {
    status: 500,
    title: 'Internal Server Error',
    type: 'urn:sgda:system:server:internal-error',
    detail: 'An unexpected error occurred on our server.',
  },
  BAD_REQUEST: {
    status: 400,
    title: 'Bad Request',
    type: 'urn:sgda:system:request:malformed',
    detail: 'The request could not be understood or was malformed.',
  },
  INFRASTRUCTURE_ERROR: {
    status: 400,
    title: 'Infrastructure error',
    type: 'urn:sgda:infra:system:general-error',
    detail: 'An internal infrastructure error occurred.',
  },
  ROUTE_NOT_FOUND: {
    status: 404,
    title: 'Route not found',
    type: 'urn:sgda:system:router:route-not-found',
    detail: 'The requested API endpoint does not exist.',
  },
  EMAIL_FAILURE: {
    status: 500,
    title: 'Email service failure',
    type: 'urn:sgda:infra:email:service-failure',
    detail: 'The email service failed to process the request.',
  },
  THIRD_PARTY_ERROR: {
    status: 502,
    title: 'Third-party service error',
    type: 'urn:sgda:infra:external:service-error',
    detail: 'An external service returned an error.',
  },
} as const satisfies Record<string, AppProblemDefinition>

export type ProblemCode = keyof typeof PROBLEM_DEFINITIONS

export const problems = createProblemTypeRegistry(PROBLEM_DEFINITIONS)

/**
 * Padrão Result Object para serviços (Versão Estrita).
 * O erro 'E' DEVE ser uma união de ProblemCode.
 */
export type ServiceError<E extends ProblemCode> = {
  error: E
  context?: E extends keyof AppProblemExtensions ? AppProblemExtensions[E] : any
}

export type ServiceResult<T, E extends ProblemCode> = T | ServiceError<E>

/**
 * Agrupa múltiplos códigos de erro de forma tipada e semântica, resolvendo o "spread overwrite".
 * Se houver colisão de status code (ex: dois 404s), os schemas são unidos via z.union (oneOf no OpenAPI),
 * permitindo que o frontend tenha autocomplete total para cada variante de erro.
 */
export function registryResponses<K extends ProblemCode>(...problemCodes: K[]) {
  const codesByStatusCode = new Map<number, K[]>()

  // 1. Agrupamos os códigos por Status HTTP para evitar colisões no objeto final
  for (const code of problemCodes) {
    const status = PROBLEM_DEFINITIONS[code].status
    const existingGroup = codesByStatusCode.get(status) ?? []
    codesByStatusCode.set(status, [...existingGroup, code])
  }

  const apiResponsesMap: any = {}

  for (const [status, codesInGroup] of codesByStatusCode.entries()) {
    // 2. Mapeamos cada código para seu schema Zod envelopado (RFC 9457)
    const variantSchemas = codesInGroup.map((code) => {
      const definition = PROBLEM_DEFINITIONS[code]

      // Extraímos apenas os campos customizados (extensões) definidos no erro
      const customExtensions = 'schema' in definition && definition.schema instanceof z.ZodObject
        ? definition.schema
        : z.object({})

      // Sênior Fix: Chamamos .openapi(code, { title: code }) para SOBRESCREVER o nome "ProblemDetails"
      // injetado internamente pela biblioteca hono-problem-details.
      return createProblemDetailsSchema(customExtensions)
        .extend({
          type: z.literal(definition.type),
          title: z.literal(definition.title),
          status: z.literal(status),
        })
        .openapi(code, { title: code })
    })

    // 3. Composição do Schema Final (Membro Único ou União/oneOf)
    let statusSchema: z.ZodType

    if (variantSchemas.length === 1) {
      statusSchema = variantSchemas[0]!
    }
    else {
      const [firstVariant, secondVariant, ...remainingVariants] = variantSchemas
      if (firstVariant && secondVariant) {
        statusSchema = z.union([firstVariant, secondVariant, ...remainingVariants]).openapi({
          discriminator: { propertyName: 'type' },
          description: `Possible error variants for status ${status}`,
        })
      }
      else {
        statusSchema = variantSchemas[0]!
      }
    }

    // 4. Montagem da resposta no padrão OpenAPI exigido pelo Hono
    apiResponsesMap[status] = {
      description: codesInGroup.map(c => PROBLEM_DEFINITIONS[c].title).join(' | '),
      content: { 'application/problem+json': { schema: statusSchema } },
    }
  }

  // 5. Retorno com Mapped Type: É aqui que a "mágica" do autocomplete acontece.
  // Reconstruímos a união de tipos AppProblem para cada Status Code em nível de tipo.
  return apiResponsesMap as {
    [S in (typeof PROBLEM_DEFINITIONS)[K]['status']]: {
      description: string
      content: {
        'application/problem+json': {
          schema: z.ZodType<{
            [K2 in K]: (typeof PROBLEM_DEFINITIONS)[K2]['status'] extends S
              ? AppProblem<K2> & { status: S }
              : never
          }[K]>
        }
      }
    }
  }
}

/**
 * Kit de respostas padrão para manter a consistência e reduzir boilerplate.
 * Inclui: 401 (Unauthorized), 403 (Forbidden) e 422 (Validation).
 */
export const standardResponses = registryResponses(
  'UNAUTHORIZED',
  'FORBIDDEN',
  'VALIDATION_ERROR',
)
