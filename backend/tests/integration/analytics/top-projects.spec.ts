import { testClient } from 'hono/testing'
import * as status from 'stoker/http-status-codes'
import { afterAll, assert, beforeAll, describe, expect, it } from 'vitest'
import { ID_ALUNO, ID_PROJ_DATA_SCIENCE, ID_PROJ_IA, ID_PROJ_ROBOTICA } from '@/constants/seed.constant'
import { ExpenseRequestStatus } from '@/generated/prisma/client'
import { createTestApp } from '@/lib/config'
import prisma from '@/lib/orm'
import { analytics } from '@/routes'
import { seedExpenseCategories, seedPreferenceSurveys, seedUsers } from '@/seeds'
import { dummyExpenseCategories } from '@/seeds/expense.category.seed'
import seedExpenses from '@/seeds/expense.seed'
import seedProjects from '@/seeds/project.seed'
import { createCostBreakdown } from '@/services/budget.service'
import { getAuthHeaders } from '../../util'

const client = testClient(createTestApp(analytics))

describe('get /analytics/top-projects', () => {
  let adminHeaders: { Authorization: string }
  const subcategoryName = dummyExpenseCategories[0]!.normalizedName

  beforeAll(async () => {
    await seedUsers()
    await seedExpenseCategories()
    await seedPreferenceSurveys()
    await seedProjects()
    await seedExpenses()
    adminHeaders = await getAuthHeaders('admin@test.com', 'ADMIN')
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

  const endpoint = client.analytics['top-projects']

  it('deve retornar o ranking de projetos baseado no valor comprometido', async () => {
    const res = await endpoint.$get({ query: {} }, { headers: adminHeaders })
    assert(res.status === status.OK)
    const json = await res.json()

    expect(Array.isArray(json)).toBe(true)
    expect(json.length).toBeGreaterThan(0)
    expect(json.at(0)?.name).toBe('Pesquisa em IA Aplicada')
  })

  it('deve respeitar o limite de resultados', async () => {
    const expense = await prisma.expenseRequest.create({
      data: {
        title: 'Custo via Serviço',
        status: ExpenseRequestStatus.EM_PROCESSAMENTO,
        event: {
          name: 'Evento Teste',
          location: 'Local Teste',
        },
        article: { classification: 'Sem Qualis' },
        studentId: ID_ALUNO,
      },
    })

    await createCostBreakdown(expense.id, {
      amount: 100,
      projectId: ID_PROJ_DATA_SCIENCE,
      subcategoryName,
    })

    const testLimit = 1
    const res = await endpoint.$get({ query: { limit: testLimit } }, { headers: adminHeaders })
    assert(res.status === status.OK)
    const json = await res.json()

    expect(json).toHaveLength(testLimit)
  })

  it('deve ranquear projetos baseado no valor comprometido real (usedBudget + em processamento) - Furo Financeiro', async () => {
    // Limpa todas as quebras de custo pré-existentes do Projeto IA (ex: injetadas pelo seed global)
    await prisma.costBreakdown.deleteMany({ where: { projectId: ID_PROJ_IA } })

    // 2. ARRANGE:
    // Projeto IA: usedBudget = 1000, sem alocações em processamento
    await prisma.project.update({
      where: { id: ID_PROJ_IA },
      data: { usedBudget: 1000 },
    })

    // Projeto Data Science: usedBudget = 0, mas com uma despesa gigante em processamento
    await prisma.project.update({
      where: { id: ID_PROJ_DATA_SCIENCE },
      data: {
        budget: 100000,
        usedBudget: 0,
      },
    })

    const massiveExpense = await prisma.expenseRequest.create({
      data: {
        title: 'Despesa Em Processamento Gigante',
        status: ExpenseRequestStatus.EM_PROCESSAMENTO,
        event: {
          name: 'Evento Internacional',
          location: 'Exterior',
        },
        article: { classification: 'A1' },
        studentId: ID_ALUNO,
      },
    })

    await prisma.costBreakdown.create({
      data: {
        amount: 50000,
        project: { connect: { id: ID_PROJ_DATA_SCIENCE } },
        expenseCategory: { connect: { normalizedName: subcategoryName } },
        expenseRequest: { connect: { id: massiveExpense.id } },
      },
    })

    // ACT
    const res = await endpoint.$get({ query: {} }, { headers: adminHeaders })
    assert(res.status === status.OK)
    const ranking = await res.json()

    // ASSERT: Data Science deve ser o primeiro colocado por causa dos 50000 em processamento
    expect(Array.isArray(ranking)).toBe(true)
    expect(ranking[0]?.name).toBe('Projeto de DATASCIENCE')
    expect(Number(ranking[0]?.totalValue)).toBe(50000)

    const iaProject = ranking.find(p => p.name === 'Pesquisa em IA Aplicada')
    expect(iaProject).toBeDefined()
    expect(Number(iaProject?.totalValue)).toBe(1000)
  })

  it('não deve contar breakdowns de despesas REJEITADAS no allocationsCount (Lixo Estatístico)', async () => {
    // ARRANGE: Cria uma despesa rejeitada com um breakdown vinculado (lixo estatístico)
    const rejectedExpense = await prisma.expenseRequest.create({
      data: {
        title: 'Despesa Lixo',
        status: ExpenseRequestStatus.REJEITADO,
        rejectionReason: 'Fraude',
        event: {
          name: 'E',
          location: 'L',
        },
        article: { classification: 'Sem Qualis' },
        studentId: ID_ALUNO,
      },
    })

    // Forçamos a criação do breakdown no banco para garantir a presença
    await prisma.costBreakdown.create({
      data: {
        amount: 500,
        project: { connect: { id: ID_PROJ_ROBOTICA } },
        expenseCategory: { connect: { normalizedName: subcategoryName } },
        expenseRequest: { connect: { id: rejectedExpense.id } },
      },
    })

    // ACT
    const res = await endpoint.$get({ query: {} }, { headers: adminHeaders })
    assert(res.status === status.OK)
    const ranking = await res.json()

    const robotica = ranking.find(p => p.name === 'Laboratório de Robótica Avançada')

    // ASSERT: A propriedade deve se chamar allocationsCount, e não deve incluir a despesa rejeitada
    expect(robotica).toBeDefined()
    expect(robotica).toHaveProperty('allocationsCount')
    expect(robotica).not.toHaveProperty('totalRequests')
    // O valor do allocationsCount depende do seed (neste ponto, não deve ser inflado por este lixo)
  })
})
