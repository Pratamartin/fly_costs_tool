import { z } from '@hono/zod-openapi'

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
    .openapi({ description: 'Lista de tipos MIME aceitos pelo servidor.' }),
  maxSizeMB: z.number().optional()
    .openapi({ description: 'Tamanho máximo permitido em Megabytes.' }),
})

export type FileUploadError = z.infer<typeof FileUploadErrorSchema>

export const DeleteExpenseResponseSchema = z.object({ success: z.literal(true) }).openapi({ description: 'Standard success response for delete operations.' })

export const ProjectPeriodExpiredSchema = z.object({
  projectStartDate: z.string().nullable()
    .openapi({ description: 'Actual start date of the project.' }),
  projectEndDate: z.string().nullable()
    .openapi({ description: 'Actual end date of the project.' }),
})

export const ProjectShrinkageConflictSchema = z.object({ orphanedCostAllocationsCount: z.number().openapi({ description: 'Number of orphaned cost allocations.' }) })
