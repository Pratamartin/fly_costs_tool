import type { ExpenseRequest, ExpenseRequestStatus, Prisma, Project } from '@/generated/prisma/client'
import prisma from '@/lib/orm'
import { sendStatusChangeEmail } from './email.notification'
import { createInAppNotification } from './in-app.notification'

export * from './email.notification'
export * from './in-app.notification'

export async function notifyStatusChange(
  userId: string,
  expense: Pick<ExpenseRequest, 'id' | 'title' | 'rejectionReason' | 'correctionReason' | 'updatedAt' | 'attachmentKey'> & { project?: Pick<Project, 'name'> | null },
  newStatus: ExpenseRequestStatus,
  extra?: string | null,
  tx?: Prisma.TransactionClient,
) {
  const execute = async (transaction: Prisma.TransactionClient) => {
    await createInAppNotification({
      userId,
      expenseRequestId: expense.id,
    }, transaction)

    await sendStatusChangeEmail(userId, expense, newStatus, extra, transaction)
  }

  if (tx) {
    await execute(tx)
  }
  else {
    await prisma.$transaction(execute)
  }
}
