import { testClient } from 'hono/testing'
import { afterAll, assert, beforeAll, describe, expect, it } from 'vitest'
import { ID_ALUNO, ID_PROJ_IA } from '@/constants/seed.constant'
import { ExpenseRequestStatus } from '@/generated/prisma/enums'
import { createTestApp } from '@/lib/config'
import prisma from '@/lib/orm'
import { expenses } from '@/routes'
import { seedExpenseCategories, seedPreferenceSurveys, seedUsers } from '@/seeds'
import { dummyExpenseCategories } from '@/seeds/expense.category.seed'
import seedProjects from '@/seeds/project.seed'
import { getAuthHeaders } from '../../util'
import { expectProblem } from '../../util/assertions'

const client = testClient(createTestApp(expenses))

describe('[Cost Breakdown] - Validações Semânticas (RFC 9457)', () => {
  let adminHeaders: { Authorization: string }
  let expenseId: string
  const category = dummyExpenseCategories[0]!

  beforeAll(async () => {
    await seedUsers()
    await seedExpenseCategories()
    await seedPreferenceSurveys()
    await seedProjects()

    adminHeaders = await getAuthHeaders('admin@test.com', 'ADMIN')

    const expense = await prisma.expenseRequest.create({
      data: {
        title: 'Despesa para Validação de Custos',
        status: ExpenseRequestStatus.EM_PROCESSAMENTO,
        event: {
          name: 'Evento de Teste',
          location: 'Local de Teste',
        },
        article: { classification: 'Sem Qualis' },
        studentId: ID_ALUNO,
      },
    })

    expenseId = expense.id
  })

  afterAll(async () => {
    await prisma.preferenceSurveyAnswer.deleteMany()
    await prisma.costBreakdown.deleteMany()
    await prisma.expenseRequest.deleteMany()
    await prisma.preferenceSurvey.deleteMany()
    await prisma.project.deleteMany()
    await prisma.expenseCategory.deleteMany()
    await prisma.user.deleteMany()
  })

  it('deve retornar erro de validação para valor zero ou negativo (too_small)', async () => {
    const res = await client.expenses[':id']['cost-breakdowns'].$post(
      {
        param: { id: expenseId },
        json: {
          amount: 0,
          projectId: ID_PROJ_IA,
          subcategoryName: category.normalizedName,
        },
      },
      { headers: adminHeaders },
    )

    const json = await expectProblem(res, 'VALIDATION_ERROR')
    const errorField = json.errors.find(e => e.field === 'amount')
    assert(errorField)
    expect(errorField.code).toBe('too_small')
    expect(errorField.params).toMatchObject({
      minimum: 0,
      inclusive: false,
    })
  })

  it('deve retornar erro de validação para subcategoria inexistente', async () => {
    const res = await client.expenses[':id']['cost-breakdowns'].$post(
      {
        param: { id: expenseId },
        json: {
          amount: 100,
          projectId: ID_PROJ_IA,
          subcategoryName: 'CATEGORIA_QUE_NAO_EXISTE',
        },
      },
      { headers: adminHeaders },
    )

    await expectProblem(res, 'INVALID_SUBCATEGORIES')
  })

  it('deve bloquear discriminação que exceda o budget considerando valores pendentes (EM_PROCESSAMENTO)', async () => {
    // 1. Criar um projeto isolado com saldo limitado
    const limitedProject = await prisma.project.create({
      data: {
        name: 'Projeto de Validação de Saldo',
        code: 'VAL-SALDO',
        budget: 500,
        usedBudget: 0,
        startDate: new Date('2026-01-01T00:00:00Z'),
        endDate: new Date('2026-12-31T00:00:00Z'),
        expenseCategories: { connect: { id: category.id! } },
      },
    })

    // 2. Criar uma segunda despesa para simular concorrência de pendentes
    const otherExpense = await prisma.expenseRequest.create({
      data: {
        title: 'Outra Despesa Pendente',
        status: ExpenseRequestStatus.EM_PROCESSAMENTO,
        event: {
          name: 'E',
          location: 'L',
        },
        article: { classification: 'Sem Qualis' },
        studentId: ID_ALUNO,
      },
    })

    // 3. Adicionar R$ 400 na primeira despesa (Saldo restante: 100)
    await client.expenses[':id']['cost-breakdowns'].$post(
      {
        param: { id: expenseId },
        json: {
          amount: 400,
          projectId: limitedProject.id,
          subcategoryName: category.normalizedName,
        },
      },
      { headers: adminHeaders },
    )

    // 4. Tentar adicionar R$ 200 na outra despesa (Total ficaria 600 > 500)
    const res = await client.expenses[':id']['cost-breakdowns'].$post(
      {
        param: { id: otherExpense.id },
        json: {
          amount: 200,
          projectId: limitedProject.id,
          subcategoryName: category.normalizedName,
        },
      },
      { headers: adminHeaders },
    )

    // 5. Deve falhar com PROJECT_INSUFFICIENT_FUNDS (Task 1.4)
    await expectProblem(res, 'PROJECT_INSUFFICIENT_FUNDS')
  })

  it('deve bloquear alocação de custo fora do período de vigência do projeto (PROJECT_PERIOD_EXPIRED)', async () => {
    // 1. Criar um projeto que já venceu (no passado)
    const expiredProject = await prisma.project.create({
      data: {
        name: 'Projeto Vencido',
        code: 'PROJ-EXPIRED',
        budget: 500,
        usedBudget: 0,
        startDate: new Date('2020-01-01T00:00:00Z'),
        endDate: new Date('2020-12-31T00:00:00Z'),
        expenseCategories: { connect: { id: category.id! } },
      },
    })

    // 2. Tentar alocar despesa hoje
    const res = await client.expenses[':id']['cost-breakdowns'].$post(
      {
        param: { id: expenseId },
        json: {
          amount: 100,
          projectId: expiredProject.id,
          subcategoryName: category.normalizedName,
        },
      },
      { headers: adminHeaders },
    )

    // 3. Deve falhar com PROJECT_PERIOD_EXPIRED
    const json = await expectProblem(res, 'PROJECT_PERIOD_EXPIRED')
    expect(json.projectStartDate).toBe(expiredProject.startDate.toISOString())
    expect(json.projectEndDate).toBe(expiredProject.endDate.toISOString())
  })
})
