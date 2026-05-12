import { z } from '@hono/zod-openapi'
import { COST_BREAKDOWN_RECEIPT_DOWNLOAD_URL_EXPIRY_SECONDS, RECEIPT_UPLOAD_MAX_SIZE_MB } from '@/constants/file.constant'
import { dummyExpenseCategories } from '@/seeds/expense.category.seed'
import { normalizeCategoryName } from '@/services/expense.category.service'
import ExpenseCategoryBaseSchema from './expense.category.schema'
import { validReceiptFileCheck } from './schema.refine'
import { FileItemSchema, IdSchema } from './shared.schema'

const BaseSchema = z.object({
  id: IdSchema,
  subcategoryName: z.string().transform(val => normalizeCategoryName(val))
    .openapi({
      description: 'Nome da subcategoria de despesa',
      example: dummyExpenseCategories.at(0)?.normalizedName,
    }),
  amount: z.number().positive()
    .openapi({ example: 150.50 }),
  attachmentKey: z.string().nullable()
    .optional()
    .openapi({ description: 'Chave do comprovante no armazenamento R2. Pode ser usado no cadastro para reaproveitar um arquivo já enviado anteriormente.' }),
})

export const CreateCostBreakdownSchema = BaseSchema.omit({ id: true })

export const CostBreakdownResponseSchema = z.object({
  id: IdSchema,
  expenseRequestId: IdSchema,
  amount: z.coerce.number()
    .openapi({ example: 150.50 }),
  subcategory: ExpenseCategoryBaseSchema,
  attachmentKey: z.string().nullable()
    .optional(),
})

export const UploadReceiptSchema = z.object({
  file: FileItemSchema.superRefine(validReceiptFileCheck(RECEIPT_UPLOAD_MAX_SIZE_MB))
    .openapi({
      type: 'string',
      format: 'binary',
      description: `Arquivo de comprovante (PDF, JPG, PNG). Tamanho máximo permitido: ${RECEIPT_UPLOAD_MAX_SIZE_MB}MB.`,
    }),
})

export const ReceiptDownloadUrlSchema = z.object({
  url: z.url()
    .openapi({
      description: 'URL assinada para download do comprovante',
      example: 'https://r2.example.com/comprovantes/inscricao_uuid_receipt.pdf?token=...',
    }),
  expiresIn: z.number()
    .openapi({
      description: 'Tempo de expiração da URL em segundos',
      example: COST_BREAKDOWN_RECEIPT_DOWNLOAD_URL_EXPIRY_SECONDS,
    }),
})
