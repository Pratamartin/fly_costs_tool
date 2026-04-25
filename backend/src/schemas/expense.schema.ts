import { z } from '@hono/zod-openapi'
import { ExpenseRequestStatus } from '@/generated/prisma/enums'
import ProjectSchema from './project.schema'
import { IdSchema, TimestampSchema } from './shared.schema'
import { UserProfileSchema } from './user.schema'

export const ExpenseRelationsSchema = {
  student: UserProfileSchema.pick({
    id: true,
    name: true,
  }).optional(),
  project: ProjectSchema.pick({
    name: true,
    code: true,
  }).extend({ id: IdSchema })
    .nullable()
    .optional(),
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
      example: ExpenseRequestStatus.APROVADO,
    }),
})

export const CreateExpenseSchema = BaseSchema.omit({ status: true })

export const ExpenseResponseSchema = z.object({ id: IdSchema })
  .extend({
    ...BaseSchema.shape,
    ...ExpenseRelationsSchema,
    ...TimestampSchema,
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
  }).shape)

export const ListExpenseResponseSchema = z.array(ExpenseListItemSchema)

export const UpdateExpenseStatusSchema = z.object({
  status: z.enum([ExpenseRequestStatus.APROVADO, ExpenseRequestStatus.REJEITADO]).openapi({
    description: 'O novo status a ser atribuído à solicitação.',
    example: ExpenseRequestStatus.REJEITADO,
  }),
})
