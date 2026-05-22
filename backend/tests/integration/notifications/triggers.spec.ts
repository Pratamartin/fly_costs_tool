import type { EmailJobData } from '@/jobs/send-email.job'
import { testClient } from 'hono/testing'
import * as status from 'stoker/http-status-codes'
import { afterAll, afterEach, assert, beforeAll, describe, expect, it, vi } from 'vitest'
import { ID_ALUNO } from '@/constants/seed.constant'
import { ExpenseRequestStatus } from '@/generated/prisma/enums'
import { jobManager } from '@/jobs'
import { createTestApp } from '@/lib/config'
import prisma from '@/lib/orm'
import { expenses } from '@/routes'
import { seedExpenseCategories, seedUsers } from '@/seeds'
import seedProjects from '@/seeds/project.seed'
import { getAuthHeaders } from '../../util'

vi.mock('@/lib/email/providers', () => ({
  createEmailProvider: () => ({
    send: vi.fn().mockResolvedValue({
      success: true,
      previewUrl: 'http://preview.url',
    }),

  }),
}))

const expenseClient = testClient(createTestApp(expenses))

describe('[Gatilhos de Notificação] - Gatilhos de mudança de status de despesa', () => {
  let alunoHeaders: { Authorization: string }
  let adminHeaders: { Authorization: string }
  let coordenadorHeaders: { Authorization: string }
  let projectId: string

  beforeAll(async () => {
    await seedUsers()
    await seedExpenseCategories()
    await seedProjects()

    const project = await prisma.project.findFirst()
    assert(project)
    projectId = project.id

    alunoHeaders = await getAuthHeaders('aluno@test.com', 'ALUNO')
    adminHeaders = await getAuthHeaders('admin@test.com', 'ADMIN')
    coordenadorHeaders = await getAuthHeaders('coordenador@test.com', 'COORDENADOR')

    await jobManager.start()
  })

  afterEach(() => {
    jobManager.boss.clearSpies()
    vi.clearAllMocks()
  })

  afterAll(async () => {
    await prisma.notification.deleteMany()
    await prisma.costBreakdown.deleteMany()
    await prisma.expenseRequest.deleteMany()
    await prisma.project.deleteMany()
    await prisma.expenseCategory.deleteMany()
    await prisma.user.deleteMany()
  })

  it('deve criar uma notificação e concluir o job de e-mail quando o coordenador rejeita uma despesa', async () => {
    const spy = jobManager.boss.getSpy<EmailJobData>('send-email')

    const createRes = await expenseClient.expenses.$post({
      json: {
        title: 'Viagem para Rejeição',
        city: 'Manaus',
        state: 'BR-AM',
        country: 'BR',
        departureDate: new Date('2026-07-01'),
        returnDate: new Date('2026-07-05'),
      },
    }, { headers: alunoHeaders })
    expect(createRes.status).toBe(status.CREATED)
    assert(createRes.status === status.CREATED)
    const { id: expenseId } = await createRes.json()

    const rejectionReason = 'Documentação incompleta'
    await expenseClient.expenses[':id'].status.$patch({
      param: { id: expenseId },
      json: {
        status: ExpenseRequestStatus.REJEITADO,
        reason: rejectionReason,
      },
    }, { headers: coordenadorHeaders })

    const notification = await prisma.notification.findFirst({
      where: {
        expenseRequestId: expenseId,
        userId: ID_ALUNO,
      },
    })
    expect(notification).toBeTruthy()

    const job = await spy.waitForJob(
      data => !!data.template && data.template.type === 'status-change' && data.template.props.reason === rejectionReason,
      'completed',
    )
    assert(job)
    assert(job.data.template?.type === 'status-change')
    expect(job.data.template?.props.newStatus).toBe(ExpenseRequestStatus.REJEITADO)
  })

  it('deve criar notificações e concluir os jobs de e-mail para aprovação e correção', async () => {
    const spy = jobManager.boss.getSpy<EmailJobData>('send-email')

    const createRes = await expenseClient.expenses.$post({
      json: {
        title: 'Viagem para Correção',
        city: 'Manaus',
        state: 'BR-AM',
        country: 'BR',
        departureDate: new Date('2026-08-01'),
        returnDate: new Date('2026-08-05'),
      },
    }, { headers: alunoHeaders })
    expect(createRes.status).toBe(status.CREATED)
    assert(createRes.status === status.CREATED)

    const { id: expenseId } = await createRes.json()

    await expenseClient.expenses[':id'].status.$patch({
      param: { id: expenseId },
      json: { status: ExpenseRequestStatus.APROVADO },
    }, { headers: coordenadorHeaders })

    await spy.waitForJob(
      data => !!data.template && data.template.type === 'status-change' && data.template.props.newStatus === ExpenseRequestStatus.APROVADO,
      'completed',
    )
    spy.clear()

    const correctionReason = 'Por favor, ajuste o título'
    await expenseClient.expenses[':id'].status.$patch({
      param: { id: expenseId },
      json: {
        status: ExpenseRequestStatus.EM_EDICAO,
        reason: correctionReason,
      },
    }, { headers: adminHeaders })

    const userNotifications = await prisma.notification.findMany({
      where: {
        expenseRequestId: expenseId,
        userId: ID_ALUNO,
      },
    })
    expect(userNotifications).toHaveLength(2)

    const correctionJob = await spy.waitForJob(
      data => data.template?.type === 'status-change' && data.template?.props.newStatus === ExpenseRequestStatus.EM_EDICAO,
      'completed',
    )
    assert(correctionJob)
    assert(correctionJob.data.template?.type === 'status-change')
    expect(correctionJob.data.template?.props.reason).toBe(correctionReason)
  })
})
