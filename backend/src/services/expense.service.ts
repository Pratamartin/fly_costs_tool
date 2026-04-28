import type { z } from '@hono/zod-openapi'
import type { Prisma } from '@/generated/prisma/client'
import type { CreateExpenseSchema, ExpenseListQuerySchema } from '@/schemas/expense.schema'
import * as phrases from 'stoker/http-status-phrases'
import { EXPENSE_ERROR_CODES } from '@/constants/expense.constant'
import { ExpenseRequestStatus } from '@/generated/prisma/client'
import { UserRole } from '@/generated/prisma/enums'
import prisma from '@/lib/orm'

type CreateExpenseDTO = z.infer<typeof CreateExpenseSchema>

export const expenseInclude = {
  student: {
    select: {
      id: true,
      name: true,
    },
  },
  project: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
} satisfies Prisma.ExpenseRequestInclude

export type ExpenseWithRelations = Prisma.ExpenseRequestGetPayload<{
  include: typeof expenseInclude
}>

export async function createExpenseRequest(userId: string, data: CreateExpenseDTO): Promise<ExpenseWithRelations | { error: string }> {
  if (data.returnDate < data.departureDate) {
    return { error: EXPENSE_ERROR_CODES.RETURN_BEFORE_DEPARTURE }
  }

  const result = await prisma.expenseRequest.create({
    data: {
      ...data,
      studentId: userId,
    },
    include: expenseInclude,
  })

  return result
}

export async function getAllExpenseRequests(
  userId: string,
  role: UserRole,
  filters: z.infer<typeof ExpenseListQuerySchema>,
) {
  const where: Prisma.ExpenseRequestWhereInput = filters

  if (role === UserRole.ALUNO) {
    where.studentId = userId
  }

  const result = await prisma.expenseRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  return result
}

export async function getExpenseById(
  id: string,
  userId: string,
  role: UserRole,
): Promise<ExpenseWithRelations | null> {
  const where: Prisma.ExpenseRequestWhereInput = { id }

  if (role === UserRole.ALUNO) {
    where.studentId = userId
  }

  const result = await prisma.expenseRequest.findFirst({
    where,
    include: expenseInclude,
  })

  return result
}

export async function updateExpenseStatus(id: string, newStatus: ExpenseRequestStatus): Promise<ExpenseWithRelations | { error: string }> {
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
    include: expenseInclude,
  })

  return updatedRequest
}
