import type { z } from '@hono/zod-openapi'
import type { CreateExpenseSchema } from '@/schemas/expense.schema'
import prisma from '@/lib/orm'
import { CreateExpenseSuccessSchema } from '@/schemas/expense.schema'

type CreateExpenseDTO = z.infer<typeof CreateExpenseSchema>

export async function createExpenseRequest(userId: string, data: CreateExpenseDTO) {
  const result = await prisma.expenseRequest.create({
    data: {
      ...data,
      studentId: userId,
    },
  })

  return CreateExpenseSuccessSchema.parse(result)
}
