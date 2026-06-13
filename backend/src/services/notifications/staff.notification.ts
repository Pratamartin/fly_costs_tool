import type { AnySchema } from 'ajv'
import type { ExpenseRequest, ExpenseRequestStatus, Prisma, Project } from '@/generated/prisma/client'
import { ROLE_FRONTEND_SLUG } from '@/constants/user.constant'
import env from '@/env'
import { UserRole } from '@/generated/prisma/enums'
import { eventJSONSchema } from '@/json'
import { dayjs } from '@/lib/date'
import { emailService } from '@/lib/email/service'
import ajv from '@/lib/json-schema-validator'
import prisma from '@/lib/orm'
import { getUsersByRoles } from '../user.service'
import { createManyInAppNotifications } from './in-app.notification'

const validateEvent = ajv.compile(eventJSONSchema as AnySchema)

export async function notifyStaffOnStatusChange(
  expense: Pick<ExpenseRequest, 'id' | 'title' | 'updatedAt' | 'attachmentKey' | 'event' | 'article'> & {
    project?: Pick<Project, 'name'> | null
    surveyAnswers?: Array<{ survey: { expenseCategory: { name: string } } }>
  },
  status: ExpenseRequestStatus,
  targetRoles: UserRole[],
  tx: Prisma.TransactionClient = prisma,
) {
  const staff = await getUsersByRoles(targetRoles, tx)

  if (staff.length === 0)
    return

  const date = dayjs(expense.updatedAt).format('DD [de] MMMM [de] YYYY')

  // Extrai detalhes do evento usando o Schema JSON via AJV (Cacheado)
  const isValid = validateEvent(expense.event)
  const eventDetails = isValid
    ? Object.values(expense.event as Record<string, any>).filter(v => typeof v === 'string') as string[]
    : ['Evento não especificado']

  // Extrai a classificação do artigo (QUALIS)
  const articleData = expense.article as Record<string, any>
  const articleClassification = articleData?.classification || 'Não informado'

  // Extrai as categorias do formulário (se existirem)
  const categories = expense.surveyAnswers?.map(ans => ans.survey.expenseCategory.name) || []

  const getActionUrl = (role: UserRole, id: string) => {
    const slug = ROLE_FRONTEND_SLUG[role]
    const baseUrl = `${env.FRONTEND_URL}/dashboard/${slug}`

    if (role === UserRole.ADMIN)
      return `${baseUrl}/expenses/detail?id=${id}`

    if (role === UserRole.COORDENADOR)
      return baseUrl

    return `${baseUrl}/expenses/detail/${id}`
  }

  // 1. Notificações In-App em Lote (Performance O(1))
  await createManyInAppNotifications({
    userIds: staff.map(u => u.id),
    expenseRequestId: expense.id,
  }, tx)

  // 2. Emails em paralelo (Assíncrono via Queue)
  const emailDispatches = staff.map(async (user) => {
    await emailService.send({
      to: user.email,
      subject: `SGDA: Nova Solicitação para Análise - ${expense.title}`,
      template: {
        type: 'staff-notification',
        props: {
          staffName: user.name,
          eventDetails,
          expenseTitle: expense.title,
          status,
          date,
          actionUrl: getActionUrl(user.role, expense.id),
          projectName: expense.project?.name,
          categories: categories.length > 0 ? categories : undefined,
          articleClassification,
        },
      },
    }, {
      tx,
      singletonKey: `staff_notif_${expense.id}_${status}_${user.id}`,
    })
  })

  await Promise.all(emailDispatches)
}
