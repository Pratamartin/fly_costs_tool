import type { z } from '@hono/zod-openapi'
import type { Prisma } from '@/generated/prisma/client'
import type { CreateExpenseSchema, ExpenseListQuerySchema, UpdateExpenseSchema } from '@/schemas/expense.schema'
import * as phrases from 'stoker/http-status-phrases'
import { EXPENSE_ERROR_CODES, EXPENSE_STATUS_TRANSITIONS, EXPENSE_VISIBILITY_BY_ROLE, STATUSES_WHERE_REASON_REQUIRED } from '@/constants/expense.constant'
import { MEMORANDUM_DOWNLOAD_URL_EXPIRY_SECONDS } from '@/constants/file.constant'
import { PROJECT_ERROR_CODES } from '@/constants/project.constant'
import { ExpenseRequestStatus } from '@/generated/prisma/client'
import { UserRole } from '@/generated/prisma/enums'
import prisma from '@/lib/orm'
import { deleteFile, getSignedDownloadUrl, isStorageConfigured, uploadFile, validatePDF } from '@/lib/storage'
import { getProjectBudgetMetrics } from './budget.service'

type CreateExpenseDTO = z.infer<typeof CreateExpenseSchema>
type UpdateExpenseDTO = z.infer<typeof UpdateExpenseSchema>

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
  costBreakdowns: {
    select: {
      id: true,
      expenseRequestId: true,
      amount: true,
      expenseCategory: {
        select: {
          id: true,
          name: true,
          normalizedName: true,
        },
      },
      attachmentKey: true,
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
  const visibility: Prisma.ExpenseRequestWhereInput
    = role === UserRole.ALUNO
      ? { studentId: userId }
      : { status: { in: EXPENSE_VISIBILITY_BY_ROLE[role] } }

  return prisma.expenseRequest.findMany({
    where: { AND: [filters, visibility] },
    orderBy: { createdAt: 'desc' },
  })
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
  else {
    where.status = { in: EXPENSE_VISIBILITY_BY_ROLE[role] }
  }

  return prisma.expenseRequest.findFirst({
    where,
    include: expenseInclude,
  })
}

export async function updateExpenseStatus(
  id: string,
  newStatus: ExpenseRequestStatus,
  userRole: UserRole,
  reason?: string | null,
): Promise<ExpenseWithRelations | { error: string }> {
  const existingRequest = await prisma.expenseRequest.findUnique({ where: { id } })

  if (!existingRequest) {
    return { error: phrases.NOT_FOUND }
  }

  if (newStatus === ExpenseRequestStatus.EM_EDICAO && userRole !== UserRole.ADMIN) {
    return { error: phrases.FORBIDDEN }
  }

  const allowedStatuses = EXPENSE_STATUS_TRANSITIONS[existingRequest.status]
  if (!allowedStatuses.includes(newStatus)) {
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
    case ExpenseRequestStatus.EM_EDICAO:
      updateData.correctionReason = reason
      break
    case ExpenseRequestStatus.APROVADO:
      updateData.rejectionReason = null
      updateData.correctionReason = null
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

  const allowedNext = EXPENSE_STATUS_TRANSITIONS[expense.status]
  if (!allowedNext.includes(ExpenseRequestStatus.EM_PROCESSAMENTO)) {
    return { error: phrases.CONFLICT }
  }

  const budgetMetrics = await getProjectBudgetMetrics(projectId)
  if ('error' in budgetMetrics) {
    return { error: budgetMetrics.error }
  }

  if (!budgetMetrics.isActive) {
    return { error: PROJECT_ERROR_CODES.PROJECT_ARCHIVED }
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

export async function attachMemorandumToExpense(
  expenseId: string,
  userId: string,
  file: File,
): Promise<ExpenseWithRelations | { error: string }> {
  if (!isStorageConfigured()) {
    return { error: EXPENSE_ERROR_CODES.STORAGE_NOT_CONFIGURED }
  }

  const expense = await prisma.expenseRequest.findUnique({ where: { id: expenseId } })
  if (!expense) {
    return { error: phrases.NOT_FOUND }
  }
  if (expense.studentId !== userId) {
    return { error: phrases.FORBIDDEN }
  }
  if (expense.status !== ExpenseRequestStatus.PENDENTE) {
    return { error: phrases.CONFLICT }
  }

  const validation = await validatePDF(file)
  if (!validation.valid) {
    return { error: validation.error ?? 'INVALID_FILE' }
  }

  if (expense.attachmentKey) {
    try {
      await deleteFile(expense.attachmentKey)
    }
    catch {
      // objeto antigo pode não existir mais no bucket
    }
  }

  const uploaded = await uploadFile({
    file,
    contentType: 'application/pdf',
    folder: 'memorandos',
  })

  return prisma.expenseRequest.update({
    where: { id: expenseId },
    data: { attachmentKey: uploaded.fileKey },
    include: expenseInclude,
  })
}

export async function getMemorandumDownloadUrl(
  expenseId: string,
  userId: string,
  role: UserRole,
): Promise<{ url: string, expiresIn: number } | { error: string }> {
  if (!isStorageConfigured()) {
    return { error: EXPENSE_ERROR_CODES.STORAGE_NOT_CONFIGURED }
  }

  const expense = await prisma.expenseRequest.findUnique({
    where: { id: expenseId },
    select: {
      attachmentKey: true,
      studentId: true,
    },
  })

  if (!expense) {
    return { error: phrases.NOT_FOUND }
  }

  if (!expense.attachmentKey) {
    return { error: EXPENSE_ERROR_CODES.MEMORANDUM_MISSING }
  }

  if (role === UserRole.ALUNO && expense.studentId !== userId) {
    return { error: phrases.FORBIDDEN }
  }

  const url = await getSignedDownloadUrl(expense.attachmentKey, MEMORANDUM_DOWNLOAD_URL_EXPIRY_SECONDS)
  return {
    url,
    expiresIn: MEMORANDUM_DOWNLOAD_URL_EXPIRY_SECONDS,
  }
}

export async function updateExpense(
  id: string,
  studentId: string,
  data: UpdateExpenseDTO,
): Promise<ExpenseWithRelations | { error: string }> {
  const existingRequest = await prisma.expenseRequest.findUnique({ where: { id } })

  if (!existingRequest) {
    return { error: phrases.NOT_FOUND }
  }

  if (existingRequest.studentId !== studentId) {
    return { error: phrases.FORBIDDEN }
  }

  if (existingRequest.status !== ExpenseRequestStatus.EM_EDICAO) {
    return { error: phrases.CONFLICT }
  }

  const updatedRequest = await prisma.expenseRequest.update({
    where: { id },
    data: {
      ...data,
      status: ExpenseRequestStatus.APROVADO,
      correctionReason: null,
    },
    include: expenseInclude,
  })

  return updatedRequest
}
