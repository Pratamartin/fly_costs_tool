import { z } from '@hono/zod-openapi'
import { COST_BREAKDOWN_RECEIPT_DOWNLOAD_URL_EXPIRY_SECONDS, RECEIPT_UPLOAD_MAX_SIZE_MB } from '@/constants/file.constant'
import { dummyExpenseCategories } from '@/seeds/expense.category.seed'
import { normalizeCategoryName } from '@/services/expense.category.service'
import ExpenseCategoryBaseSchema from './expense.category.schema'
import ProjectSchema from './project.schema'
import { validReceiptFileCheck } from './schema.refine'
import { FileItemSchema, IdSchema } from './shared.schema'

const BaseSchema = z.object({
  id: IdSchema,
  projectId: IdSchema.openapi({ description: 'Target project ID' }),
  subcategoryName: z.string().transform(val => normalizeCategoryName(val))
    .openapi({
      description: 'Expense subcategory name',
      example: dummyExpenseCategories.at(0)?.normalizedName,
    }),
  amount: z.number().positive()
    .openapi({ example: 150.50 }),
  attachmentKey: z.string().nullable()
    .optional()
    .openapi({ description: 'Receipt key in R2 storage. Can be used during registration to reuse a previously uploaded file.' }),
})

export const CreateCostBreakdownSchema = BaseSchema.omit({ id: true })

export const CostBreakdownResponseSchema = z.object({
  id: IdSchema,
  expenseRequestId: IdSchema,
  projectId: IdSchema,
  amount: z.coerce.number()
    .openapi({ example: 150.50 }),
  subcategory: ExpenseCategoryBaseSchema,
  project: ProjectSchema.pick({
    name: true,
    code: true,
  }).extend({ id: IdSchema })
    .optional(),
  attachmentKey: z.string().nullable()
    .optional(),
})

export const UploadReceiptSchema = z.object({
  file: FileItemSchema.superRefine(validReceiptFileCheck(RECEIPT_UPLOAD_MAX_SIZE_MB))
    .openapi({
      type: 'string',
      format: 'binary',
      description: `Receipt file (PDF, JPG, PNG). Maximum size allowed: ${RECEIPT_UPLOAD_MAX_SIZE_MB}MB.`,
    }),
})

export const ReceiptDownloadUrlSchema = z.object({
  url: z.url()
    .openapi({
      description: 'Signed URL for receipt download',
      example: 'https://r2.example.com/comprovantes/inscricao_uuid_receipt.pdf?token=...',
    }),
  expiresIn: z.number()
    .openapi({
      description: 'URL expiration time in seconds',
      example: COST_BREAKDOWN_RECEIPT_DOWNLOAD_URL_EXPIRY_SECONDS,
    }),
})
