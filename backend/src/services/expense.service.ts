import type { z } from '@hono/zod-openapi'
import type { Prisma } from '@/generated/prisma/client'
import type { CreateExpenseSchema } from '@/schemas/expense.schema'
import { UserRole } from '@/generated/prisma/enums'
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
export async function getAllExpenseRequests(
  userId: string,
  role: UserRole,
) {
  const where: Prisma.ExpenseRequestWhereInput = {}

  const include: Prisma.ExpenseRequestInclude = {
    project: {
      select: {
        id: true,
        name: true,
      },
    },
  }

  if (role === UserRole.ALUNO) {
    where.studentId = userId
  }
  else {
    include.student = {
      select: {
        id: true,
        name: true,
      },
    }
  }

  const result = await prisma.expenseRequest.findMany({
    where,
    include,
    orderBy: { createdAt: 'desc' },
  })

  return result.map(item => ({
    ...item,
    amount: item.amount.toString(),
  }))
}
