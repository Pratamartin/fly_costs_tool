import type { z } from '@hono/zod-openapi'
import type { Prisma } from '@/generated/prisma/client'
import type { CreateExpenseSchema, ExpenseListQuerySchema } from '@/schemas/expense.schema'
import * as phrases from 'stoker/http-status-phrases'
import { EXPENSE_ERROR_CODES, STATUSES_ALLOWED_TO_ASSIGN_PROJECT, STATUSES_FOR_COORDINATOR_ANALYSIS, STATUSES_WHERE_REASON_REQUIRED } from '@/constants/expense.constant'
import { PROJECT_ERROR_CODES } from '@/constants/project.constant'
import { ExpenseRequestStatus } from '@/generated/prisma/client'
import { UserRole } from '@/generated/prisma/enums'
import prisma from '@/lib/orm'
import { getProjectBudgetMetrics } from './budget.service'

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

export async function updateExpenseStatus(id: string, newStatus: ExpenseRequestStatus, reason?: string | null): Promise<ExpenseWithRelations | { error: string }> {
  const existingRequest = await prisma.expenseRequest.findUnique({ where: { id } })

  if (!existingRequest) {
    return { error: phrases.NOT_FOUND }
  }

  if (!STATUSES_FOR_COORDINATOR_ANALYSIS.includes(existingRequest.status)) {
    return { error: phrases.CONFLICT }
  }

  if (STATUSES_WHERE_REASON_REQUIRED.includes(newStatus) && !reason) {
    return { error: EXPENSE_ERROR_CODES.REASON_REQUIRED }
  }

  const updateData: Prisma.ExpenseRequestUpdateInput = { status: newStatus }

  switch (newStatus) {
    case ExpenseRequestStatus.REJEITADO:
      updateData.rejectionReason = reason
      break

    case ExpenseRequestStatus.APROVADO:
      updateData.rejectionReason = null
      break
  }

  const updatedRequest = await prisma.expenseRequest.update({
    where: { id },
    data: updateData,
    include: expenseInclude,
  })

  return updatedRequest
}

export async function assignProjectToExpense(expenseId: string, projectId: string): Promise<ExpenseWithRelations | { error: string }> {
  const expense = await prisma.expenseRequest.findUnique({ where: { id: expenseId } })
  if (!expense) {
    return { error: phrases.NOT_FOUND }
  }

  if (!STATUSES_ALLOWED_TO_ASSIGN_PROJECT.includes(expense.status)) {
    return { error: phrases.CONFLICT }
  }

  const budgetMetrics = await getProjectBudgetMetrics(projectId)
  if ('error' in budgetMetrics) {
    return { error: budgetMetrics.error }
  }

  if (budgetMetrics.available.lessThanOrEqualTo(0)) {
    return { error: PROJECT_ERROR_CODES.INSUFFICIENT_FUNDS }
  }

  const updatedExpense = await prisma.expenseRequest.update({
    where: { id: expenseId },
    include: expenseInclude,
    data: {
      status: ExpenseRequestStatus.EM_PROCESSAMENTO,
      projectId,
    },
  })

  return updatedExpense
}
