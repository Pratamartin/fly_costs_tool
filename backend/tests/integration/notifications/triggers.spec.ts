import type { EmailJobData } from '@/jobs/send-email.job'
import type { EmitOptions } from '@/lib/jobs'
import { testClient } from 'hono/testing'
import * as status from 'stoker/http-status-codes'
import { afterAll, afterEach, assert, beforeAll, describe, expect, it, vi } from 'vitest'
import { ID_ALUNO } from '@/constants/seed.constant'
import { ExpenseRequestStatus, UserRole } from '@/generated/prisma/enums'
import { jobManager } from '@/jobs'
import { createTestApp } from '@/lib/config'
import prisma from '@/lib/orm'
import { expenses } from '@/routes'
import { seedExpenseCategories, seedPreferenceSurveys, seedUsers } from '@/seeds'
import { dummyExpenseCategories } from '@/seeds/expense.category.seed'
import seedProjects from '@/seeds/project.seed'
import { notifyStaffOnStatusChange } from '@/services/notifications/staff.notification'
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
  let _projectId: string
  const categoryId = dummyExpenseCategories[0]!.id!

  beforeAll(async () => {
    await seedUsers()
    await seedExpenseCategories()
    await seedPreferenceSurveys()
    await seedProjects()

    const project = await prisma.project.findFirst()
    assert(project)
    _projectId = project.id

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
    await prisma.preferenceSurveyAnswer.deleteMany()
    await prisma.notification.deleteMany()
    await prisma.costBreakdown.deleteMany()
    await prisma.expenseRequest.deleteMany()
    await prisma.preferenceSurvey.deleteMany()
    await prisma.project.deleteMany()
    await prisma.expenseCategory.deleteMany()
    await prisma.user.deleteMany()
  })

  it('deve criar uma notificação e concluir o job de e-mail quando o coordenador rejeita uma despesa', async () => {
    const spy = jobManager.boss.getSpy<EmailJobData>('send-email')

    const createRes = await expenseClient.expenses.$post({
      json: {
        title: 'Viagem para Rejeição',
        event: {
          name: 'Evento Teste',
          location: 'Local Teste',
        },
        article: { classification: 'Sem Qualis' },
        surveyAnswers: [
          {
            expenseCategoryId: categoryId,
            data: { invoiceKey: 'formulario-preferencias/aluno-uuid/invoice.pdf' },
          },
        ],
      },
    }, { headers: alunoHeaders })
    assert(createRes.status === status.CREATED)
    const { id: expenseId } = await createRes.json()

    // 1. Validar que Coordenador foi notificado da nova despesa
    const staffJob = await spy.waitForJob(
      data => data.to === 'coordenador@test.com' && data.template?.type === 'staff-notification',
      'completed',
    )
    assert(staffJob)
    if (staffJob.data.template?.type === 'staff-notification') {
      expect(staffJob.data.template.props.status).toBe(ExpenseRequestStatus.PENDENTE)
      expect(staffJob.data.template.props.actionUrl).toContain('/coordinator')
    }
    spy.clear()

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
    const emitSpy = vi.spyOn(jobManager, 'emit')

    const createRes = await expenseClient.expenses.$post({
      json: {
        title: 'Viagem para Correção',
        event: {
          name: 'Evento Teste',
          location: 'Local Teste',
        },
        article: { classification: 'Sem Qualis' },
        surveyAnswers: [
          {
            expenseCategoryId: categoryId,
            data: { invoiceKey: 'formulario-preferencias/aluno-uuid/invoice.pdf' },
          },
        ],
      },
    }, { headers: alunoHeaders })
    assert(createRes.status === status.CREATED)

    const { id: expenseId } = await createRes.json()
    emitSpy.mockClear()

    await expenseClient.expenses[':id'].status.$patch({
      param: { id: expenseId },
      json: { status: ExpenseRequestStatus.APROVADO },
    }, { headers: coordenadorHeaders })

    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 50))

    // Validar que Admin foi notificado da aprovação
    const adminCalls = emitSpy.mock.calls.filter((call) => {
      const data = call[1] as EmailJobData
      return data.to === 'admin@test.com' && data.template?.type === 'staff-notification' && data.template.props.status === ExpenseRequestStatus.APROVADO
    })
    expect(adminCalls).toHaveLength(1)
    const adminData = adminCalls[0]![1] as EmailJobData
    assert(adminData.template?.type === 'staff-notification')
    expect(adminData.template.props.actionUrl).toContain('/admin/expenses/detail?id=')
    expect(adminData.template.props.categories).toBeDefined()
    expect(adminData.template.props.categories?.length).toBeGreaterThan(0)

    // Validar o e-mail do aluno
    const studentCalls = emitSpy.mock.calls.filter((call) => {
      const data = call[1] as EmailJobData
      return data.to === 'aluno@test.com' && data.template?.type === 'status-change' && data.template.props.newStatus === ExpenseRequestStatus.APROVADO
    })
    expect(studentCalls).toHaveLength(1)

    emitSpy.mockClear()

    const correctionReason = 'Por favor, ajuste o título'
    await expenseClient.expenses[':id'].status.$patch({
      param: { id: expenseId },
      json: {
        status: ExpenseRequestStatus.EM_EDICAO,
        reason: correctionReason,
      },
    }, { headers: adminHeaders })

    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 50))

    const userNotifications = await prisma.notification.findMany({
      where: {
        expenseRequestId: expenseId,
        userId: ID_ALUNO,
      },
    })
    expect(userNotifications).toHaveLength(2)

    const correctionCalls = emitSpy.mock.calls.filter((call) => {
      const data = call[1] as EmailJobData
      return data.to === 'aluno@test.com' && data.template?.type === 'status-change' && data.template.props.newStatus === ExpenseRequestStatus.EM_EDICAO
    })
    expect(correctionCalls).toHaveLength(1)
    const correctionData = correctionCalls[0]![1] as EmailJobData
    assert(correctionData.template?.type === 'status-change')
    expect(correctionData.template.props.reason).toBe(correctionReason)

    emitSpy.mockRestore()
  })

  it('deve notificar apenas staff ativo (Passo 5.1.2)', async () => {
    // Desativar coordenador temporariamente
    await prisma.user.update({
      where: { email: 'coordenador@test.com' },
      data: { isActive: false },
    })

    const emitSpy = vi.spyOn(jobManager, 'emit')

    const createRes = await expenseClient.expenses.$post({
      json: {
        title: 'Despesa Staff Inativo',
        event: {
          name: 'Evento Teste',
          location: 'Local Teste',
        },
        article: { classification: 'Sem Qualis' },
        surveyAnswers: [{
          expenseCategoryId: categoryId,
          data: { invoiceKey: 'formulario-preferencias/test.pdf' },
        }],
      },
    }, { headers: alunoHeaders })

    if (createRes.status !== status.CREATED) {
      console.error('FAILED CREATE EXPENSE (Staff Inativo):', await createRes.json())
    }
    assert(createRes.status === status.CREATED)

    // Verify emit was not called for coordenador
    const coordinatorCalls = emitSpy.mock.calls.filter((call) => {
      const data = call[1] as EmailJobData
      return data.to === 'coordenador@test.com'
    })
    expect(coordinatorCalls).toHaveLength(0)

    emitSpy.mockRestore()

    // Reativar para não quebrar outros testes
    await prisma.user.update({
      where: { email: 'coordenador@test.com' },
      data: { isActive: true },
    })
  })

  it('deve realizar rollback de notificações se a transação falhar (Passo 5.4.1)', async () => {
    const expense = await prisma.expenseRequest.create({
      data: {
        title: 'Rollback Test',
        studentId: ID_ALUNO,
        status: ExpenseRequestStatus.PENDENTE,
        event: {
          name: 'Evento Teste',
          location: 'Local Teste',
        },
        article: { classification: 'Sem Qualis' },
      },
    })

    try {
      await prisma.$transaction(async (tx) => {
        await notifyStaffOnStatusChange(expense, ExpenseRequestStatus.PENDENTE, [UserRole.COORDENADOR], tx)
        throw new Error('Forced Rollback')
      })
    }
    catch { /* ignore */ }

    const notifications = await prisma.notification.findMany({ where: { expenseRequestId: expense.id } })
    expect(notifications).toHaveLength(0)
  })

  it('deve respeitar idempotência via singletonKey (Passo 5.4.2)', async () => {
    const emitSpy = vi.spyOn(jobManager, 'emit')
    const expense = await prisma.expenseRequest.create({
      data: {
        title: 'Idempotency Test',
        studentId: ID_ALUNO,
        status: ExpenseRequestStatus.PENDENTE,
        event: {
          name: 'Evento Teste',
          location: 'Local Teste',
        },
        article: { classification: 'Sem Qualis' },
      },
    })

    await notifyStaffOnStatusChange(expense, ExpenseRequestStatus.PENDENTE, [UserRole.COORDENADOR])
    const jobs = emitSpy.mock.calls.filter((call) => {
      const data = call[1] as EmailJobData
      return data.to === 'coordenador@test.com'
    })

    const firstCall = jobs[0]
    assert(firstCall, 'Deveria ter emitido o job para o coordenador (1ª chamada)')
    const firstCallOptions = firstCall[2] as EmitOptions | undefined
    assert(firstCallOptions?.singletonKey, 'A opção singletonKey é obrigatória para idempotência')
    const firstKey = firstCallOptions.singletonKey

    emitSpy.mockClear()

    await notifyStaffOnStatusChange(expense, ExpenseRequestStatus.PENDENTE, [UserRole.COORDENADOR])
    const secondJobs = emitSpy.mock.calls.filter((call) => {
      const data = call[1] as EmailJobData
      return data.to === 'coordenador@test.com'
    })

    const secondCall = secondJobs[0]
    assert(secondCall, 'Deveria ter emitido o job para o coordenador (2ª chamada)')
    const secondCallOptions = secondCall[2] as EmitOptions | undefined
    assert(secondCallOptions?.singletonKey, 'A opção singletonKey é obrigatória para idempotência')
    const secondKey = secondCallOptions.singletonKey

    expect(firstKey).toBe(secondKey)
    expect(firstKey).toContain(`staff_notif_${expense.id}`)
    emitSpy.mockRestore()
  })
})
