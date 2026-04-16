import type { z } from '@hono/zod-openapi'
import type { Prisma } from '@/generated/prisma/client'
import type { CreateExpenseSchema, ExpenseListQuerySchema } from '@/schemas/expense.schema'
import * as phrases from 'stoker/http-status-phrases'
import { ExpenseRequestStatus } from '@/generated/prisma/client'
import { UserRole } from '@/generated/prisma/enums'
import prisma from '@/lib/orm'

type CreateExpenseDTO = z.infer<typeof CreateExpenseSchema>

export async function createExpenseRequest(userId: string, data: CreateExpenseDTO) {
  const result = await prisma.expenseRequest.create({
    data: {
      ...data,
      studentId: userId,
    },
  })

  return {
    ...result,
    amount: result.amount.toString(),
  }
}
export async function getAllExpenseRequests(
  userId: string,
  role: UserRole,
  filters: z.infer<typeof ExpenseListQuerySchema>,
) {
  const where: Prisma.ExpenseRequestWhereInput = filters

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

export async function getExpenseById(
  id: string,
  userId: string,
  role: UserRole,
) {
  const where: Prisma.ExpenseRequestWhereInput = { id }

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

  const result = await prisma.expenseRequest.findFirst({
    where,
    include,
  })

  if (!result)
    return null

  return {
    ...result,
    amount: result.amount.toString(),
  }
}

export async function updateExpenseStatus(id: string, newStatus: ExpenseRequestStatus) {
  const existingRequest = await prisma.expenseRequest.findUnique({ where: { id } })

  if (!existingRequest) {
    return { error: phrases.NOT_FOUND }
  }

  if (existingRequest.status !== ExpenseRequestStatus.PENDENTE) {
    return { error: phrases.CONFLICT }
  }

  const updatedRequest = await prisma.expenseRequest.update({
    where: { id },
    data: { status: newStatus },
  })

  return {
    data: {
      ...updatedRequest,
      amount: updatedRequest.amount.toString(),
    },
  }
}
