import type { z } from '@hono/zod-openapi'
import type { ServiceResult } from '@/lib/problems'
import type { CreateExpenseSchema, ExpenseListQuerySchema, UpdateExpenseSchema } from '@/schemas/expense.schema'
import { EXPENSE_STATUS_TRANSITIONS, EXPENSE_VISIBILITY_BY_ROLE, REQUIRED_ROLE_FOR_STATUS, STAFF_NOTIFICATION_TARGETS_BY_STATUS, STATUSES_WHERE_REASON_REQUIRED } from '@/constants/expense.constant'
import { MEMORANDUM_DOWNLOAD_URL_EXPIRY_SECONDS } from '@/constants/file.constant'
import { Prisma } from '@/generated/prisma/client'
import { ExpenseRequestStatus, UserRole } from '@/generated/prisma/enums'
import prisma from '@/lib/orm'
import { deleteFile, deleteObjects, getSignedDownloadUrl, isStorageConfigured, uploadFile, validatePDF } from '@/lib/storage'
import { notifyStatusChange } from './notifications'
import { notifyStaffOnStatusChange } from './notifications/staff.notification'

import { createSurveyAnswer, validateAnswers } from './preference-survey.service'

type CreateExpenseDTO = z.infer<typeof CreateExpenseSchema>
type UpdateExpenseDTO = z.infer<typeof UpdateExpenseSchema>

export const expenseInclude = {
  student: {
    select: {
      id: true,
      name: true,
      profile: {
        select: {
          bankCode: true,
          bankName: true,
          bankAgency: true,
          bankAccount: true,
          pixKey: true,
        },
      },
    },
  },
  costBreakdowns: {
    select: {
      id: true,
      expenseRequestId: true,
      amount: true,
      projectId: true,
      project: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
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
  surveyAnswers: {
    select: {
      id: true,
      data: true,
      surveyId: true,
      survey: {
        select: {
          schema: true,
          expenseCategory: { select: { name: true } },
        },
      },
    },
  },
} satisfies Prisma.ExpenseRequestInclude

export type ExpenseWithRelations = Prisma.ExpenseRequestGetPayload<{
  include: typeof expenseInclude
}>

export async function createExpenseRequest(userId: string, data: CreateExpenseDTO): Promise<ServiceResult<ExpenseWithRelations, 'VALIDATION_ERROR' | 'INTERNAL_SERVER_ERROR'>> {
  const { surveyAnswers, event, article, ...rest } = data

  const validationResult = await validateAnswers(surveyAnswers)
  if ('error' in validationResult) {
    return validationResult
  }

  const result = await prisma.$transaction(async (tx) => {
    const expense = await tx.expenseRequest.create({
      data: {
        ...rest,
        event: event as Prisma.InputJsonValue,
        article: article as Prisma.InputJsonValue,
        studentId: userId,
        status: ExpenseRequestStatus.PENDENTE,
      },
    })

    for (const answer of surveyAnswers) {
      await createSurveyAnswer(
        tx,
        expense.id,
        answer.expenseCategoryId,
        answer.data,
      )
    }

    const result = await tx.expenseRequest.findUnique({
      where: { id: expense.id },
      include: expenseInclude,
    })

    if (result) {
      const staffTargets = STAFF_NOTIFICATION_TARGETS_BY_STATUS[ExpenseRequestStatus.PENDENTE]
      if (staffTargets) {
        await notifyStaffOnStatusChange(
          result,
          ExpenseRequestStatus.PENDENTE,
          staffTargets,
          tx,
        )
      }
    }

    return result
  })

  if (!result) {
    return { error: 'INTERNAL_SERVER_ERROR' }
  }

  return result
}

export async function getAllExpenseRequests(
  userId: string,
  role: UserRole,
  filters: z.infer<typeof ExpenseListQuerySchema>,
): Promise<ExpenseWithRelations[]> {
  const visibility: Prisma.ExpenseRequestWhereInput
    = role === UserRole.ALUNO
      ? { studentId: userId }
      : { status: { in: EXPENSE_VISIBILITY_BY_ROLE[role] } }

  return prisma.expenseRequest.findMany({
    where: { AND: [filters, visibility] },
    orderBy: { createdAt: 'desc' },
    include: {
      ...expenseInclude,
      surveyAnswers: {
        select: {
          id: true,
          data: true,
          surveyId: true,
        },
      },
    },
  })
}

export async function getExpenseById(
  id: string,
  userId: string,
  role: UserRole,
): Promise<ServiceResult<ExpenseWithRelations, 'EXPENSE_NOT_FOUND' | 'FORBIDDEN'>> {
  const expense = await prisma.expenseRequest.findUnique({
    where: { id },
    include: expenseInclude,
  })

  if (!expense) {
    return { error: 'EXPENSE_NOT_FOUND' }
  }

  if (role === UserRole.ALUNO && expense.studentId !== userId) {
    return { error: 'FORBIDDEN' }
  }

  if (role !== UserRole.ADMIN && role !== UserRole.ALUNO && !EXPENSE_VISIBILITY_BY_ROLE[role].includes(expense.status)) {
    return { error: 'FORBIDDEN' }
  }

  return expense
}

export async function updateExpenseStatus(
  id: string,
  newStatus: ExpenseRequestStatus,
  userRole: UserRole,
  reason?: string | null,
): Promise<ServiceResult<ExpenseWithRelations, 'EXPENSE_NOT_FOUND' | 'INVALID_TRANSITION' | 'FORBIDDEN' | 'MISSING_REASON'>> {
  const existingRequest = await prisma.expenseRequest.findUnique({ where: { id } })

  if (!existingRequest) {
    return { error: 'EXPENSE_NOT_FOUND' }
  }

  const requiredRoles = REQUIRED_ROLE_FOR_STATUS[newStatus]
  if (requiredRoles && !requiredRoles.includes(userRole)) {
    return { error: 'FORBIDDEN' }
  }

  const allowedStatuses = EXPENSE_STATUS_TRANSITIONS[existingRequest.status]
  if (!allowedStatuses.includes(newStatus)) {
    return {
      error: 'INVALID_TRANSITION',
      context: {
        resourceState: {
          current: existingRequest.status,
          allowed: allowedStatuses,
        },
      },
    }
  }

  if (STATUSES_WHERE_REASON_REQUIRED.includes(newStatus) && !reason) {
    return { error: 'MISSING_REASON' }
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

  return prisma.$transaction(async (tx) => {
    const updatedRequest = await tx.expenseRequest.update({
      where: { id },
      data: updateData,
      include: expenseInclude,
    })

    await notifyStatusChange(
      updatedRequest.studentId,
      updatedRequest,
      updatedRequest.status,
      null,
      tx,
    )

    const staffTargets = STAFF_NOTIFICATION_TARGETS_BY_STATUS[newStatus]
    if (staffTargets) {
      await notifyStaffOnStatusChange(
        updatedRequest,
        newStatus,
        staffTargets,
        tx,
      )
    }

    return updatedRequest
  })
}

export async function startExpenseProcessing(expenseId: string): Promise<ServiceResult<ExpenseWithRelations, 'EXPENSE_NOT_FOUND' | 'INVALID_EXPENSE_STATE'>> {
  const expense = await prisma.expenseRequest.findUnique({ where: { id: expenseId } })
  if (!expense) {
    return { error: 'EXPENSE_NOT_FOUND' }
  }

  const allowedNext = EXPENSE_STATUS_TRANSITIONS[expense.status]
  if (!allowedNext.includes(ExpenseRequestStatus.EM_PROCESSAMENTO)) {
    return {
      error: 'INVALID_EXPENSE_STATE',
      context: {
        resourceState: {
          current: expense.status,
          required: [ExpenseRequestStatus.APROVADO],
        },
      },
    }
  }

  const updatedExpense = await prisma.expenseRequest.update({
    where: { id: expenseId },
    include: expenseInclude,
    data: { status: ExpenseRequestStatus.EM_PROCESSAMENTO },
  })

  await notifyStatusChange(
    updatedExpense.studentId,
    updatedExpense,
    updatedExpense.status,
  )

  return updatedExpense
}
export async function attachMemorandumToExpense(
  expenseId: string,
  userId: string,
  file: File,
): Promise<ServiceResult<ExpenseWithRelations, 'EXPENSE_NOT_FOUND' | 'STORAGE_UNAVAILABLE' | 'FORBIDDEN' | 'INVALID_EXPENSE_STATE' | 'FILE_TOO_LARGE' | 'UNSUPPORTED_MEDIA_TYPE'>> {
  if (!isStorageConfigured()) {
    return { error: 'STORAGE_UNAVAILABLE' }
  }

  const expense = await prisma.expenseRequest.findUnique({ where: { id: expenseId } })
  if (!expense) {
    return { error: 'EXPENSE_NOT_FOUND' }
  }
  if (expense.studentId !== userId) {
    return { error: 'FORBIDDEN' }
  }
  if (expense.status !== ExpenseRequestStatus.PENDENTE) {
    return { error: 'INVALID_EXPENSE_STATE' }
  }

  const validation = await validatePDF(file)
  if (!validation.valid) {
    if (validation.error?.includes('size')) {
      return { error: 'FILE_TOO_LARGE' }
    }
    return { error: 'UNSUPPORTED_MEDIA_TYPE' }
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
): Promise<ServiceResult<{ url: string, expiresIn: number }, 'EXPENSE_NOT_FOUND' | 'STORAGE_UNAVAILABLE' | 'MISSING_MEMO' | 'FORBIDDEN'>> {
  if (!isStorageConfigured()) {
    return { error: 'STORAGE_UNAVAILABLE' }
  }

  const expense = await prisma.expenseRequest.findUnique({
    where: { id: expenseId },
    select: {
      attachmentKey: true,
      studentId: true,
    },
  })

  if (!expense) {
    return { error: 'EXPENSE_NOT_FOUND' }
  }

  if (!expense.attachmentKey) {
    return { error: 'MISSING_MEMO' }
  }

  if (role === UserRole.ALUNO && expense.studentId !== userId) {
    return { error: 'FORBIDDEN' }
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
): Promise<ServiceResult<ExpenseWithRelations, 'EXPENSE_NOT_FOUND' | 'FORBIDDEN' | 'INVALID_EXPENSE_STATE' | 'VALIDATION_ERROR'>> {
  const existingRequest = await prisma.expenseRequest.findUnique({ where: { id } })

  if (!existingRequest) {
    return { error: 'EXPENSE_NOT_FOUND' }
  }

  if (existingRequest.studentId !== studentId) {
    return { error: 'FORBIDDEN' }
  }

  if (existingRequest.status !== ExpenseRequestStatus.EM_EDICAO) {
    return { error: 'INVALID_EXPENSE_STATE' }
  }

  const { surveyAnswers, event, article, ...rest } = data

  if (surveyAnswers) {
    const validationResult = await validateAnswers(surveyAnswers)
    if ('error' in validationResult) {
      return validationResult
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    if (surveyAnswers) {
      // Estratégia simples: Deletar tudo e re-inserir usando a versão ATIVA
      await tx.preferenceSurveyAnswer.deleteMany({ where: { expenseRequestId: id } })

      for (const answer of surveyAnswers) {
        await createSurveyAnswer(
          tx,
          id,
          answer.expenseCategoryId,
          answer.data,
        )
      }
    }

    const updateData: Prisma.ExpenseRequestUpdateInput = {
      ...rest,
      status: ExpenseRequestStatus.APROVADO,
      correctionReason: null,
    }

    if (event)
      updateData.event = event as Prisma.InputJsonValue
    if (article)
      updateData.article = article as Prisma.InputJsonValue

    const result = await tx.expenseRequest.update({
      where: { id },
      data: updateData,
      include: expenseInclude,
    })

    const staffTargets = STAFF_NOTIFICATION_TARGETS_BY_STATUS[ExpenseRequestStatus.APROVADO]
    if (staffTargets) {
      await notifyStaffOnStatusChange(
        result,
        ExpenseRequestStatus.APROVADO,
        staffTargets,
        tx,
      )
    }

    return result
  })

  return result
}

export async function concludeExpenseRequest(
  id: string,
  userRole: UserRole,
): Promise<ServiceResult<ExpenseWithRelations, 'EXPENSE_NOT_FOUND' | 'FORBIDDEN' | 'INVALID_EXPENSE_STATE' | 'MISSING_BREAKDOWNS' | 'MISSING_RECEIPTS'>> {
  const expense = await prisma.expenseRequest.findUnique({
    where: { id },
    include: { costBreakdowns: true },
  })

  if (!expense) {
    return { error: 'EXPENSE_NOT_FOUND' }
  }

  if (userRole !== UserRole.ADMIN) {
    return { error: 'FORBIDDEN' }
  }

  if (expense.status !== ExpenseRequestStatus.EM_PROCESSAMENTO) {
    return { error: 'INVALID_EXPENSE_STATE' }
  }

  if (expense.costBreakdowns.length === 0) {
    return { error: 'MISSING_BREAKDOWNS' }
  }

  const missingReceipts = expense.costBreakdowns.some(cb => !cb.attachmentKey)
  if (missingReceipts) {
    return { error: 'MISSING_RECEIPTS' }
  }

  return prisma.$transaction(async (tx) => {
    // 1. Agrupar os valores por projeto para evitar múltiplos updates no mesmo registro
    const amountsByProject = expense.costBreakdowns.reduce((acc, cb) => {
      const current = acc.get(cb.projectId) || new Prisma.Decimal(0)
      acc.set(cb.projectId, current.plus(cb.amount))
      return acc
    }, new Map<string, Prisma.Decimal>())

    // 2. Ordenar IDs dos projetos para prevenção de deadlock
    const sortedProjectIds = Array.from(amountsByProject.keys()).sort()

    // 3. Executar um único incremento por projeto envolvido
    for (const projectId of sortedProjectIds) {
      const amount = amountsByProject.get(projectId)!
      await tx.project.update({
        where: { id: projectId },
        data: { usedBudget: { increment: amount } },
      })
    }

    // 4. Atualizar status para CONCLUIDO
    const updatedExpense = await tx.expenseRequest.update({
      where: { id },
      data: { status: ExpenseRequestStatus.CONCLUIDO },
      include: expenseInclude,
    })

    await notifyStatusChange(
      updatedExpense.studentId,
      updatedExpense,
      updatedExpense.status,
      null,
      tx,
    )

    return updatedExpense
  }, { isolationLevel: 'Serializable' })
}

export async function deleteExpenseRequest(
  id: string,
  userId: string,
  role: UserRole,
): Promise<ServiceResult<{ success: true }, 'EXPENSE_NOT_FOUND' | 'FORBIDDEN' | 'STORAGE_UNAVAILABLE' | 'INVALID_EXPENSE_STATE'>> {
  const expense = await prisma.expenseRequest.findUnique({
    where: { id },
    select: {
      studentId: true,
      status: true,
      attachmentKey: true,
      costBreakdowns: {
        select: {
          attachmentKey: true,
          projectId: true,
          amount: true,
        },
      },
    },
  })

  if (!expense) {
    return { error: 'EXPENSE_NOT_FOUND' }
  }

  if (role !== UserRole.ADMIN && expense.studentId !== userId) {
    return { error: 'FORBIDDEN' }
  }

  // Bloquear deleção de despesas já concluídas para preservar integridade financeira
  if (expense.status === ExpenseRequestStatus.CONCLUIDO) {
    return { error: 'INVALID_EXPENSE_STATE' }
  }

  const keys = [
    expense.attachmentKey,
    ...expense.costBreakdowns.map(cb => cb.attachmentKey),
  ].filter((k): k is string => k !== null)

  if (keys.length > 0 && !isStorageConfigured()) {
    return { error: 'STORAGE_UNAVAILABLE' }
  }

  return prisma.$transaction(async (tx) => {
    // O saldo do projeto não é decrementado aqui porque só é incrementado quando a despesa é concluída
    if (keys.length > 0) {
      await deleteObjects(keys)
    }

    await tx.expenseRequest.delete({ where: { id } })

    return { success: true }
  })
}
