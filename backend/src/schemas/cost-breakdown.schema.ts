import { z } from '@hono/zod-openapi'
import { COST_BREAKDOWN_RECEIPT_DOWNLOAD_URL_EXPIRY_SECONDS, RECEIPT_UPLOAD_MAX_SIZE_MB } from '@/constants/file.constant'
import { ExpenseRequestStatus } from '@/generated/prisma/enums'
import { dummyExpenseCategories } from '@/seeds/expense.category.seed'
import { normalizeCategoryName } from '@/services/expense.category.service'
import ExpenseCategoryBaseSchema from './expense.category.schema'
import ProjectSchema from './project.schema'
import { validReceiptFileCheck } from './schema.refine'
import { FileItemSchema, IdSchema, OrderSchema, PaginationSchema } from './shared.schema'

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

export const CreateCostBreakdownSchema = BaseSchema.omit({ id: true }).openapi('CreateCostBreakdownRequest')

export const UpdateCostBreakdownSchema = CreateCostBreakdownSchema.partial().openapi('UpdateCostBreakdownRequest')

export const CostBreakdownFiltersSchema = z.object({
  status: z.enum([ExpenseRequestStatus.EM_PROCESSAMENTO, ExpenseRequestStatus.CONCLUIDO])
    .optional()
    .openapi({ description: 'Filter by expense status' }),
  startDate: z.coerce.date().optional()
    .openapi({ description: 'Filter by minimum creation date' }),
  endDate: z.coerce.date().optional()
    .openapi({ description: 'Filter by maximum creation date' }),
  subcategoryName: z.union([z.string(), z.array(z.string())]).optional()
    .openapi({ description: 'Filter by subcategory name(s)' }),
  studentId: IdSchema.optional().openapi({ description: 'Filter by student ID' }),
  search: z.string().optional()
    .openapi({ description: 'Search term for student name or expense title' }),
})

export const ListProjectCostBreakdownsQuerySchema = PaginationSchema
  .merge(OrderSchema)
  .merge(CostBreakdownFiltersSchema)
  .openapi('ListProjectCostBreakdownsQuery')

export const CostBreakdownResponseSchema = z.object({
  id: IdSchema,
  expenseRequestId: IdSchema.openapi({ description: 'ID of the parent expense request' }),
  projectId: IdSchema.openapi({ description: 'Target project ID' }),
  amount: z.coerce.number()
    .openapi({ example: 150.50 }),
  subcategory: ExpenseCategoryBaseSchema.openapi({ description: 'Category details for the breakdown' }),
  project: ProjectSchema.pick({
    name: true,
    code: true,
  }).extend({ id: IdSchema })
    .optional()
    .openapi({ description: 'Target project details' }),
  attachmentKey: z.string().nullable()
    .optional()
    .openapi({ description: 'Receipt key in R2 storage.' }),
}).openapi('CostBreakdown')

export const ProjectCostBreakdownResponseSchema = CostBreakdownResponseSchema.extend({
  createdAt: z.coerce.date().openapi({ example: '2026-06-27T00:00:00Z' }),
  expense: z.object({
    id: IdSchema,
    title: z.string().openapi({ example: 'Flight to Conference' }),
    status: z.nativeEnum(ExpenseRequestStatus).openapi({ example: 'CONCLUIDO' }),
    createdAt: z.coerce.date().openapi({ example: '2026-06-25T00:00:00Z' }),
    student: z.object({
      id: IdSchema,
      name: z.string().openapi({ example: 'John Doe' }),
    }).openapi({ description: 'Student who submitted the expense' }),
  }).openapi({ description: 'Parent expense request details' }),
}).openapi('ProjectCostBreakdown')

export const ListProjectCostBreakdownsResponseSchema = z.array(ProjectCostBreakdownResponseSchema).openapi('ProjectCostBreakdownListResponse')

export const UploadReceiptSchema = z.object({
  file: FileItemSchema.superRefine(validReceiptFileCheck(RECEIPT_UPLOAD_MAX_SIZE_MB))
    .openapi({
      type: 'string',
      format: 'binary',
      description: `Receipt file (PDF, JPG, PNG). Maximum size allowed: ${RECEIPT_UPLOAD_MAX_SIZE_MB}MB.`,
    }),
}).openapi('UploadReceiptRequest')

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
}).openapi('ReceiptDownloadResponse')
