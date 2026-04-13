import { z } from '@hono/zod-openapi'
import { ExpenseRequestStatus, ExpenseTopic } from '@/generated/prisma/enums'
import { TimestampSchema } from './shared.schema'

export const CreateExpenseSchema = z.object({
  title: z.string().openapi({ example: 'Inscrição - SBSC 2026' }),
  description: z.string().openapi({ example: 'Inscrição para apresentação de artigo aceito no Simpósio Brasileiro de Sistemas Colaborativos.' }),
  topic: z.enum(ExpenseTopic).openapi({ examples: Object.values(ExpenseTopic) }),
  amount: z.number()
    .positive()
    .multipleOf(0.01)
    .openapi({
      description: 'Valor total em Reais (BRL).',
      example: 450.00,
    }),
})

export const CreateExpenseSuccessSchema = z.object({
  id: z.uuid()
    .openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
  status: z.enum(ExpenseRequestStatus).default('PENDENTE')
    .openapi({ example: ExpenseRequestStatus.PENDENTE }),
}).extend(TimestampSchema)

const StudentSchema = z.object({
  id: z.uuid()
    .openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
  name: z.string().openapi({ example: 'João Silva' }),
})

const ProjectSchema = z.object({
  id: z.uuid()
    .openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
  name: z.string().openapi({ example: 'Laboratório de Robótica' }),
})

export const ExpenseListItemSchema = CreateExpenseSuccessSchema.extend({
  title: z.string().openapi({ example: 'Inscrição - SBSC 2026' }),
  amount: z.string().openapi({
    example: '450.00',
    description: 'Valor formatado como string para evitar perda de precisão em ponto flutuante.',
  }),
  student: StudentSchema.optional(),
  project: ProjectSchema.nullable().optional(),
})

export const ListExpenseSuccessSchema = z.array(ExpenseListItemSchema)
