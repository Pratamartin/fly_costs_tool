import { z } from '@hono/zod-openapi'
import { ExpenseRequestStatus, ExpenseTopic } from '@/generated/prisma/enums'
import ProjectSchema from './project.schema'
import { IdSchema, TimestampSchema } from './shared.schema'
import { UserProfileSchema } from './user.schema'

const ExpenseRelationsSchema = {
  student: UserProfileSchema.pick({
    id: true,
    name: true,
  }).optional(),
  project: ProjectSchema.pick({ name: true }).extend({ id: IdSchema })
    .nullable()
    .optional(),
}

const AmountStringSchema = z.string().openapi({
  description: 'Valor total formatado como string para garantir precisão (BRL).',
  example: '450.00',
})

const BaseSchema = z.object({
  title: z.string().openapi({ example: 'Inscrição - SBSC 2026' }),
  description: z.string().openapi({
    example:
      'Inscrição para apresentação de artigo aceito no Simpósio Brasileiro de Sistemas Colaborativos.',
  }),
  topic: z.enum(ExpenseTopic).openapi({ examples: Object.values(ExpenseTopic) }),
  amount: z.number()
    .positive()
    .multipleOf(0.01)
    .openapi({
      description: 'Valor total em Reais (BRL).',
      example: 450.00,
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
    amount: AmountStringSchema,
    ...ExpenseRelationsSchema,
    ...TimestampSchema,
  })

export const ExpenseListQuerySchema = BaseSchema.pick({ status: true }).partial()

export const ExpenseListItemSchema = z.object({ id: IdSchema })
  .extend(BaseSchema.pick({
    title: true,
    status: true,
  }).shape)
  .extend({
    amount: AmountStringSchema,
    ...ExpenseRelationsSchema,
  })

export const ListExpenseResponseSchema = z.array(ExpenseListItemSchema)

export const UpdateExpenseStatusSchema = z.object({
  status: z.enum([ExpenseRequestStatus.APROVADO, ExpenseRequestStatus.REJEITADO]).openapi({
    description: 'O novo status a ser atribuído à solicitação.',
    example: ExpenseRequestStatus.REJEITADO,
  }),
})
