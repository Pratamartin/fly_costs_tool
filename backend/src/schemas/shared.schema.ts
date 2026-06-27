import { z } from '@hono/zod-openapi'
import { INVITE_CODE_LENGTH } from '@/constants/invite.constant'

export const IdSchema = z.uuid()
  .openapi({ example: '123e4567-e89b-12d3-a456-426614174000' })

export const TimestampSchema = z.object({
  createdAt: z.coerce.date()
    .openapi({ example: '2026-02-02T12:34:56Z' }),
  updatedAt: z.coerce.date()
    .openapi({ example: '2026-02-02T12:45:00Z' }),
}).shape

export const FileItemSchema = z
  .instanceof(File)
  .openapi({
    type: 'string',
    format: 'binary',
    description: 'Binary file for upload',
  })

export const MultiFileSchema = z.object({ files: z.array(FileItemSchema).openapi({ description: 'Multiple files for upload' }) })

export const PaginationSchema = z.object({
  limit: z.coerce.number().int()
    .min(1)
    .max(100)
    .default(20)
    .openapi({
      example: 20,
      description: 'Number of records per page',
    }),
  offset: z.coerce.number().int()
    .min(0)
    .default(0)
    .openapi({
      example: 0,
      description: 'Number of records to skip',
    }),
})

/**
 * Schema for an individual validation error item.
 */
export const ValidationErrorItemSchema = z.object({
  field: z.string().openapi({ description: 'Field path (e.g., student.email)' }),
  code: z.string().openapi({ description: 'Constraint identifier (e.g., too_small, required)' }),
  params: z.record(z.string(), z.any()).optional()
    .openapi({ description: 'Semantic metadata for the constraint (e.g., { min: 3 })' }),
  message: z.string().openapi({ description: 'Human-readable error message' }),
})

export type ValidationErrorItem = z.infer<typeof ValidationErrorItemSchema>

/**
 * Factory para schemas de transição de estado.
 * Centraliza a definição de metadados de erro para transições inválidas (RFC 9457).
 * @param statusSchema Schema que define os valores possíveis de status (ex: z.nativeEnum)
 */
export function createResourceStateSchema<T extends z.ZodTypeAny>(statusSchema: T) {
  return z.object({
    resourceState: z.object({
      current: statusSchema.openapi({ description: 'The current status of the resource.' }),
      allowed: z.array(statusSchema).openapi({ description: 'List of valid next statuses from the current state.' }),
    }),
  })
}

/**
 * Schema para erros de upload de arquivos.
 * Usado em FILE_TOO_LARGE (413) e UNSUPPORTED_MEDIA_TYPE (415) para detalhar restrições.
 */
export const FileUploadErrorSchema = z.object({
  allowedMimeTypes: z.array(z.string()).optional()
    .openapi({ description: 'List of MIME types accepted by the server.' }),
  maxSizeMB: z.number().optional()
    .openapi({ description: 'Maximum file size allowed in Megabytes.' }),
})

export type FileUploadError = z.infer<typeof FileUploadErrorSchema>

export const DeleteExpenseResponseSchema = z.object({ success: z.literal(true) }).openapi('DeleteExpenseResponse')

export const ProjectPeriodExpiredSchema = z.object({
  projectStartDate: z.string().nullable()
    .openapi({ description: 'Actual start date of the project.' }),
  projectEndDate: z.string().nullable()
    .openapi({ description: 'Actual end date of the project.' }),
})

export const ProjectShrinkageConflictSchema = z.object({ orphanedCostAllocationsCount: z.number().openapi({ description: 'Number of orphaned cost allocations.' }) })

export const InviteAlreadyUsedSchema = z.object({
  usedAt: z.string().nullable()
    .openapi({
      description: 'ISO 8601 timestamp of when the invite was consumed.',
      example: '2026-06-15T14:32:00.000Z',
    }),
})

export const InviteAlreadyExpiredSchema = z.object({
  expiredAt: z.string()
    .openapi({
      description: 'ISO 8601 timestamp of when the invite expired.',
      example: '2026-06-01T00:00:00.000Z',
    }),
})

export const ProjectInsufficientFundsSchema = z.object({
  availableBudget: z.string()
    .openapi({
      description: 'Remaining available budget in the project at the time of the request.',
      example: '1250.00',
    }),
})

export const InvalidSubcategoriesSchema = z.object({
  invalidNames: z.array(z.string()).optional()
    .openapi({
      description: 'Subcategory names that were rejected because they do not belong to the project.',
      example: ['passagem-aerea'],
    }),
  allowedNames: z.array(z.string()).optional()
    .openapi({
      description: 'Full list of subcategory names accepted by this project.',
      example: ['inscricao', 'diarias'],
    }),
  minAllowed: z.number().int()
    .optional()
    .openapi({
      description: 'Minimum number of subcategories required.',
      example: 1,
    }),
  maxAllowed: z.number().int()
    .optional()
    .openapi({
      description: 'Maximum number of subcategories allowed.',
      example: 10,
    }),
  received: z.number().int()
    .optional()
    .openapi({
      description: 'Number of subcategories received in the request.',
      example: 0,
    }),
})

export const FileDownloadResponseSchema = z.object({
  downloadUrl: z.string().url()
    .openapi({ description: 'Signed URL for downloading the file' }),
  expiresIn: z.number().openapi({ description: 'Expiration time of the URL in seconds' }),
}).openapi('FileDownloadResponse')

export const InviteCodeStringSchema = z.string()
  .toUpperCase()
  .length(INVITE_CODE_LENGTH, `Invite code must be exactly ${INVITE_CODE_LENGTH} characters long`)
  .regex(/^[0-9A-F]+$/, 'Invite code must contain only uppercase hex characters')
  .openapi({ description: 'The hex invite code' })
