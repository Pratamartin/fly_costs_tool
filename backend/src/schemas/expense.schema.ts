import { z } from '@hono/zod-openapi'
import { STATUSES_WHERE_REASON_REQUIRED } from '@/constants/expense.constant'
import { MEMORANDUM_UPLOAD_MAX_SIZE_MB } from '@/constants/file.constant'
import { ExpenseRequestStatus } from '@/generated/prisma/enums'
import { articleJSONSchema, eventJSONSchema } from '@/json'
import { CostBreakdownResponseSchema } from './cost-breakdown.schema'
import { PreferenceSurveyAnswerSchema } from './preference-survey.schema'
import ProjectSchema from './project.schema'
import { reasonFieldRequired, validPDFCheck } from './schema.refine'
import { FileItemSchema, IdSchema, TimestampSchema } from './shared.schema'
import { UserSchema } from './user.schema'

export const ExpenseRelationsSchema = {
  student: UserSchema.pick({
    id: true,
    name: true,
  }).optional(),
  project: ProjectSchema.pick({
    name: true,
    code: true,
  }).extend({ id: IdSchema })
    .nullable()
    .optional(),
  costBreakdowns: z.array(CostBreakdownResponseSchema).optional(),
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
      description: 'Status atual da solicitação',
      example: ExpenseRequestStatus.REJEITADO,
    }),
  rejectionReason: z.string().nullable()
    .openapi({
      description: 'Motivo registrado caso a solicitação tenha sido rejeitada.',
      example: 'O aluno solicitante excedeu o limite semestral de benefícios.',
    }),
  correctionReason: z.string().nullable()
    .openapi({
      description: 'Motivo registrado caso a solicitação tenha sido devolvida para correção.',
      example: 'Por favor, ajuste o título da despesa para condizer com o memorando.',
    }),
})

export const CreateExpenseSchema = BaseSchema.omit({
  status: true,
  rejectionReason: true,
  correctionReason: true,
}).extend({
  surveyAnswers: z.array(PreferenceSurveyAnswerSchema).min(1, { message: 'Selecione pelo menos uma preferência para continuar.' })
    .openapi({ description: 'Lista de categorias e respostas de formulário solicitadas' }),
})

export const ExpenseResponseSchema = z.object({ id: IdSchema })
  .extend({
    ...BaseSchema.shape,
    attachmentKey: z.string().nullable()
      .optional()
      .openapi({ description: 'Chave do memorando (PDF) no armazenamento R2.' }),
    ...ExpenseRelationsSchema,
    ...TimestampSchema,
    surveyAnswers: z.array(z.object({
      id: IdSchema,
      data: z.any(),
      surveyId: IdSchema,
    })).optional(),
  })

export const ExpenseListQuerySchema = BaseSchema.pick({ status: true }).partial()

export const ExpenseListItemSchema = z.object({
  id: IdSchema,
  studentId: IdSchema
    .optional(),
  projectId: IdSchema
    .nullable()
    .optional(),
})
  .extend(BaseSchema.pick({
    title: true,
    status: true,
    rejectionReason: true,
    correctionReason: true,
  }).shape)
  .extend({
    attachmentKey: z.string().nullable()
      .optional(),
    ...TimestampSchema,
  })

export const ListExpenseResponseSchema = z.array(ExpenseListItemSchema)

export const UpdateExpenseStatusSchema = z.object({
  status: z.enum([ExpenseRequestStatus.APROVADO, ExpenseRequestStatus.REJEITADO, ExpenseRequestStatus.EM_EDICAO]).openapi({
    description: 'O novo status a ser atribuído à solicitação.',
    example: ExpenseRequestStatus.REJEITADO,
  }),
  reason: z.string().nullable()
    .optional()
    .openapi({
      description: `Reason for change. **Required** if status is: ${STATUSES_WHERE_REASON_REQUIRED.join(' or ')}.`,
      example: 'Documentação pendente: Realize o ajuste necessário.',
    }),
}).check(reasonFieldRequired)

export const UploadMemorandumSchema = z.object({ file: FileItemSchema.superRefine(validPDFCheck(MEMORANDUM_UPLOAD_MAX_SIZE_MB)) })

export const CreateExpenseResponseSchema = ExpenseResponseSchema.extend({ status: z.literal(ExpenseRequestStatus.PENDENTE) })

export const AssignProjectResponseSchema = ExpenseResponseSchema.extend({ status: z.literal(ExpenseRequestStatus.EM_PROCESSAMENTO) })

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
      .optional(),
  })

export const ExpenseReportQuerySchema = z.object({
  from: z.coerce.date().optional()
    .openapi({
      description: 'Data inicial para filtro (createdAt)',
      example: '2026-01-01T00:00:00Z',
    }),
  to: z.coerce.date().optional()
    .openapi({
      description: 'Data final para filtro (createdAt)',
      example: '2026-12-31T23:59:59Z',
    }),
  status: z.enum(ExpenseRequestStatus).optional()
    .openapi({
      description: 'Filtrar por status',
      example: ExpenseRequestStatus.APROVADO,
    }),
  projectId: IdSchema.optional().openapi({ description: 'Filtrar por projeto' }),
  studentId: IdSchema.optional().openapi({ description: 'Filtrar por aluno' }),
})
