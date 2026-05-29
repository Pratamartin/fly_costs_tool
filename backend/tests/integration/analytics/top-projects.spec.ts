import { testClient } from 'hono/testing'
import * as status from 'stoker/http-status-codes'
import { afterAll, assert, beforeAll, describe, expect, it } from 'vitest'
import { ID_ALUNO, ID_PROJ_DATA_SCIENCE, ID_PROJ_ROBOTICA } from '@/constants/seed.constant'
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
        projectId: ID_PROJ_DATA_SCIENCE,
        studentId: ID_ALUNO,
      },
    })

    await createCostBreakdown(expense.id, {
      amount: 100,
      subcategoryName,
    })

    const testLimit = 1
    const res = await endpoint.$get({ query: { limit: testLimit } }, { headers: adminHeaders })
    assert(res.status === status.OK)
    const json = await res.json()

    expect(json).toHaveLength(testLimit)
  })

  it('deve usar a contagem de requisições como critério de desempate no ranking', async () => {
    const VALOR_PARA_EMPATAR = 15000

    // ARRANGE: Prepara o cenário de empate
    const baseExpense = await prisma.expenseRequest.create({
      data: {
        title: 'Gasto Base para Empate',
        status: ExpenseRequestStatus.EM_PROCESSAMENTO,
        event: {
          name: 'Evento Teste',
          location: 'Local Teste',
        },
        article: { classification: 'Sem Qualis' },
        projectId: ID_PROJ_ROBOTICA,
        studentId: ID_ALUNO,
      },
    })

    await createCostBreakdown(baseExpense.id, {
      amount: VALOR_PARA_EMPATAR,
      subcategoryName,
    })

    // ARRANGE: Cria a vantagem em volume (quantidade de requisições)
    await prisma.expenseRequest.create({
      data: {
        title: 'Gasto Extra para Desempate',
        status: ExpenseRequestStatus.EM_PROCESSAMENTO,
        event: {
          name: 'Evento Teste',
          location: 'Local Teste',
        },
        article: { classification: 'Sem Qualis' },
        projectId: ID_PROJ_ROBOTICA,
        studentId: ID_ALUNO,
      },
    })

    // ACT: Executa a ação
    const res = await endpoint.$get({ query: {} }, { headers: adminHeaders })
    assert(res.status === status.OK)
    const ranking = await res.json()

    // ASSERT: Valida que a Robótica passou a IA por ter mais requisições
    expect(Array.isArray(ranking)).toBe(true)
    expect(ranking[0]?.name).toBe('Laboratório de Robótica Avançada')
    expect(ranking[1]?.name).toBe('Pesquisa em IA Aplicada')
  })
})
