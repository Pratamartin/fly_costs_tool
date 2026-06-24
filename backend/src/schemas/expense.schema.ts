import { z } from '@hono/zod-openapi'
import { STATUSES_WHERE_REASON_REQUIRED } from '@/constants/expense.constant'
import { MEMORANDUM_UPLOAD_MAX_SIZE_MB } from '@/constants/file.constant'
import { ExpenseRequestStatus } from '@/generated/prisma/enums'
import { articleJSONSchema, eventJSONSchema } from '@/json'
import { CostBreakdownResponseSchema } from './cost-breakdown.schema'
import { DynamicSurveyDataSchema, PreferenceSurveyAnswerSchema } from './preference-survey.schema'
import ProjectSchema from './project.schema'
import { reasonFieldRequired, validPDFCheck } from './schema.refine'
import { FileItemSchema, IdSchema, TimestampSchema } from './shared.schema'
import { ProfileSchema, UserSchema } from './user.schema'

export const ExpenseRelationsSchema = {
  student: UserSchema.pick({
    id: true,
    name: true,
  }).extend({
    profile: ProfileSchema.pick({
      bankCode: true,
      bankName: true,
      bankAgency: true,
      bankAccount: true,
      pixKey: true,
    }).nullable()
      .optional()
      .openapi({ description: 'Student profile financial details' }),
  })
    .optional()
    .openapi({ description: 'Student details' }),
  project: ProjectSchema.pick({
    name: true,
    code: true,
  }).extend({ id: IdSchema })
    .nullable()
    .optional()
    .openapi({ description: 'Assigned project details' }),
  costBreakdowns: z.array(CostBreakdownResponseSchema).optional()
    .openapi({ description: 'List of cost breakdowns associated with the request' }),
}

const BaseSchema = z.object({
  title: z.string().openapi({ example: 'Inscrição - SBSC 2026' }),
  description: z.string().nullable()
    .optional()
    .openapi({
      example:
      'Inscrição para apresentação de artigo aceito no Simpósio Brasileiro de Sistemas Colaborativos.',
    }),
  event: z.fromJSONSchema(eventJSONSchema as any, { defaultTarget: 'draft-7' }).openapi({
    description: eventJSONSchema.description,
    example: eventJSONSchema.examples[0],
  }),
  article: z.fromJSONSchema(articleJSONSchema as any, { defaultTarget: 'draft-7' }).openapi({
    description: articleJSONSchema.description,
    example: articleJSONSchema.examples[0],
  }),
  status: z.enum(ExpenseRequestStatus)
    .openapi({
      description: 'Current request status',
      example: ExpenseRequestStatus.REJEITADO,
    }),
  rejectionReason: z.string().nullable()
    .openapi({
      description: 'Recorded reason if the request was rejected.',
      example: 'The applicant student has exceeded the semi-annual benefit limit.',
    }),
  correctionReason: z.string().nullable()
    .openapi({
      description: 'Recorded reason if the request was returned for correction.',
      example: 'Please adjust the expense title to match the published work.',
    }),
})

export const CreateExpenseSchema = BaseSchema.omit({
  status: true,
  rejectionReason: true,
  correctionReason: true,
}).extend({
  surveyAnswers: z.array(PreferenceSurveyAnswerSchema).min(1, { message: 'Select at least one preference to continue.' })
    .openapi({ description: 'List of categories and requested form responses' }),
})
  .openapi('CreateExpenseRequest')

export const ExpenseResponseSchema = z.object({ id: IdSchema })
  .extend({
    ...BaseSchema.shape,
    attachmentKey: z.string().nullable()
      .optional()
      .openapi({ description: 'Published work key (PDF) in R2 storage.' }),
    ...ExpenseRelationsSchema,
    ...TimestampSchema,
    surveyAnswers: z.array(z.object({
      id: IdSchema,
      data: DynamicSurveyDataSchema,
      surveyId: IdSchema,
    })).optional()
      .openapi({ description: 'List of submitted preference surveys (e.g. flights, daily allowances, registrations)' }),
  })
  .openapi('Expense')

export const ExpenseListQuerySchema = BaseSchema.pick({ status: true }).partial()
  .openapi('ListExpensesQuery')

export const ExpenseListItemSchema = z.object({
  id: IdSchema,
  studentId: IdSchema
    .optional()
    .openapi({ description: 'ID of the student who created the request' }),
})
  .extend(BaseSchema.pick({
    title: true,
    status: true,
    rejectionReason: true,
    correctionReason: true,
  }).shape)
  .extend({
    attachmentKey: z.string().nullable()
      .optional()
      .openapi({ description: 'Published work key (PDF) in R2 storage.' }),
    ...TimestampSchema,
    surveyAnswers: z.array(z.object({
      id: IdSchema,
      data: DynamicSurveyDataSchema,
      surveyId: IdSchema,
    })).optional()
      .openapi({ description: 'List of submitted preference surveys (e.g. flights, daily allowances, registrations)' }),
  })
  .openapi('ExpenseListItem')

export const ListExpenseResponseSchema = z.array(ExpenseListItemSchema).openapi('ExpenseListResponse')

export const UpdateExpenseStatusSchema = z.object({
  status: z.enum([ExpenseRequestStatus.APROVADO, ExpenseRequestStatus.REJEITADO, ExpenseRequestStatus.EM_EDICAO]).openapi({
    description: 'The new status to be assigned to the request.',
    example: ExpenseRequestStatus.REJEITADO,
  }),
  reason: z.string().nullable()
    .optional()
    .openapi({
      description: `Reason for change. **Required** if status is: ${STATUSES_WHERE_REASON_REQUIRED.join(' or ')}.`,
      example: 'Documentação pendente: Realize o ajuste necessário.',
    }),
}).check(reasonFieldRequired)
  .openapi('UpdateExpenseStatusRequest')

export const UploadMemorandumSchema = z.object({
  file: FileItemSchema
    .openapi({
      description: `The published work PDF file (application/pdf). Maximum size allowed: ${MEMORANDUM_UPLOAD_MAX_SIZE_MB}MB.`,
      type: 'string',
      format: 'binary',
    })
    .superRefine(validPDFCheck(MEMORANDUM_UPLOAD_MAX_SIZE_MB)),
}).openapi('UploadMemorandumRequest')

export const CreateExpenseResponseSchema = ExpenseResponseSchema.extend({ status: z.literal(ExpenseRequestStatus.PENDENTE) }).openapi('CreateExpenseResponse')

export const AssignProjectResponseSchema = ExpenseResponseSchema.extend({ status: z.literal(ExpenseRequestStatus.EM_PROCESSAMENTO) }).openapi('StartProcessingResponse')

export const UpdateExpenseSchema = BaseSchema
  .pick({
    title: true,
    description: true,
    event: true,
    article: true,
  })
  .partial()
  .extend({
    surveyAnswers: z.array(PreferenceSurveyAnswerSchema).min(1, { message: 'Select at least one preference to continue.' })
      .optional()
      .openapi({ description: 'List of categories and requested form responses' }),
  })
  .openapi('UpdateExpenseRequest')

export const ExpenseReportQuerySchema = z.object({
  from: z.coerce.date().optional()
    .openapi({
      description: 'Initial date for filtering (createdAt)',
      example: '2026-01-01T00:00:00Z',
    }),
  to: z.coerce.date().optional()
    .openapi({
      description: 'Final date for filtering (createdAt)',
      example: '2026-12-31T23:59:59Z',
    }),
  status: z.enum(ExpenseRequestStatus).optional()
    .openapi({
      description: 'Filter by status',
      example: ExpenseRequestStatus.APROVADO,
    }),
  projectId: IdSchema.optional().openapi({ description: 'Filter by project' }),
  studentId: IdSchema.optional().openapi({ description: 'Filter by student' }),
}).openapi('ExpenseReportQuery')
