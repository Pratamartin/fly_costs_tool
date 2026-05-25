import { z } from '@hono/zod-openapi'
import { STATUSES_WHERE_REASON_REQUIRED } from '@/constants/expense.constant'
import { MEMORANDUM_UPLOAD_MAX_SIZE_MB } from '@/constants/file.constant'
import { ExpenseRequestStatus } from '@/generated/prisma/enums'
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
  surveyAnswers: z.array(PreferenceSurveyAnswerSchema).min(1)
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
      description: `Motivo da alteração. **Obrigatório** se o status for: ${STATUSES_WHERE_REASON_REQUIRED.join(' ou ')}.`,
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
  })
  .partial()
  .extend({ surveyAnswers: z.array(PreferenceSurveyAnswerSchema).optional() })
