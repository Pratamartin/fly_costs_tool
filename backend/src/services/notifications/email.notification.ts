import type { ExpenseRequest, Prisma, Project } from '@/generated/prisma/client'
import env from '@/env'
import { ExpenseRequestStatus } from '@/generated/prisma/client'
import { dayjs } from '@/lib/date'
import { emailService } from '@/lib/email/service'
import { logger } from '@/lib/logger'
import { getUserById } from '../user.service'

function getStatusChangeReason(status: ExpenseRequestStatus, expense: Pick<ExpenseRequest, 'rejectionReason' | 'correctionReason'>, extra?: string | null) {
  if (extra)
    return extra
  if (status === ExpenseRequestStatus.REJEITADO)
    return expense.rejectionReason
  if (status === ExpenseRequestStatus.EM_EDICAO)
    return expense.correctionReason
  return null
}

function getExpenseDetailUrl(expenseId: string, status: ExpenseRequestStatus) {
  const baseUrl = `${env.FRONTEND_URL}/dashboard/student/expenses`
  if (status === ExpenseRequestStatus.EM_EDICAO) {
    return `${baseUrl}/edit/${expenseId}`
  }
  return `${baseUrl}/detail/${expenseId}`
}

export async function sendStatusChangeEmail(
  userId: string,
  expense: Pick<ExpenseRequest, 'id' | 'title' | 'rejectionReason' | 'correctionReason' | 'updatedAt' | 'attachmentKey'> & { project?: Pick<Project, 'name'> | null },
  newStatus: ExpenseRequestStatus,
  extra?: string | null,
  tx?: Prisma.TransactionClient,
) {
  try {
    const userResult = await getUserById(userId, tx)
    if ('error' in userResult) {
      logger.warn({
        userId,
        error: userResult.error,
      }, 'User not found when trying to send status change email')
      return
    }

    const user = userResult

    const date = dayjs(expense.updatedAt).format('DD [de] MMMM [de] YYYY')
    const reason = getStatusChangeReason(newStatus, expense, extra)
    const detailPage = getExpenseDetailUrl(expense.id, newStatus)

    const emailResult = await emailService.send({
      to: user.email,
      subject: `SGDA: Atualização de Status - ${expense.title}`,
      template: {
        type: 'status-change',
        props: {
          studentName: user.name,
          expenseDescription: expense.title,
          newStatus,
          date,
          detailPage,
          reason,
          projectName: expense.project?.name,
          hasMemorandum: Boolean(expense.attachmentKey),
        },
      },
    }, {
      tx,
      singletonKey: `status_change_${expense.id}_${newStatus}`,
    })

    if (!emailResult.success) {
      logger.error({
        userId,
        expenseId: expense.id,
        error: emailResult.error,
      }, 'Failed to queue status change email')
    }
  }
  catch (error) {
    logger.error(
      {
        err: error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
            }
          : error,
        userId,
        expenseId: expense.id,
      },
      'Failed to send status change email',
    )
  }
}
