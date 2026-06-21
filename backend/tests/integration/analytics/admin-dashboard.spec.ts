import { testClient } from 'hono/testing'
import * as status from 'stoker/http-status-codes'
import { afterAll, assert, beforeAll, describe, expect, it } from 'vitest'
import { ExpenseRequestStatus } from '@/generated/prisma/enums'
import { createTestApp } from '@/lib/config'
import prisma from '@/lib/orm'
import { analytics } from '@/routes'
import { seedExpenseCategories, seedPreferenceSurveys, seedUsers } from '@/seeds'
import seedExpenses, { dummyExpenses } from '@/seeds/expense.seed'
import seedProjects, { dummyProjects } from '@/seeds/project.seed'
import { getAuthHeaders } from '../../util'
import { expectProblem } from '../../util/assertions'

const client = testClient(createTestApp(analytics))

describe('get /analytics/admin-dashboard', () => {
  let alunoHeaders: { Authorization: string }
  let adminHeaders: { Authorization: string }

  beforeAll(async () => {
    await seedUsers()
    await seedExpenseCategories()
    await seedPreferenceSurveys()
    await seedProjects()
    await seedExpenses()
    alunoHeaders = await getAuthHeaders('aluno@test.com', 'ALUNO')
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

  const endpoint = client.analytics['admin-dashboard']

  it('deve retornar 401 quando nenhum token é fornecido', async () => {
    const res = await endpoint.$get({ query: {} })
    await expectProblem(res, 'UNAUTHORIZED')
  })

  it('deve retornar 403 quando um ALUNO tenta acessar o dashboard', async () => {
    const res = await endpoint.$get({ query: {} }, { headers: alunoHeaders })
    await expectProblem(res, 'FORBIDDEN')
  })

  it('deve retornar estatísticas corretas e valores financeiros como string', async () => {
    const res = await endpoint.$get({ query: {} }, { headers: adminHeaders })

    assert(res.status === status.OK)

    const json = await res.json()

    expect(json.totalRequests).toBe(dummyExpenses.length)
    expect(json.byStatus).toEqual(expect.objectContaining({
      APROVADO: 1,
      REJEITADO: 1,
      PENDENTE: 1,
      EM_PROCESSAMENTO: 1,
      EM_EDICAO: 1,
    }))

    const expectedTotalValue = dummyProjects
      .reduce((acc, proj) => acc + Number(proj.budget), 0)
      .toString()

    // O budget committed agora é = (usedBudget dos projetos) + (costBreakdowns em EM_PROCESSAMENTO)
    const dbProjects = await prisma.project.findMany()
    const dbPending = await prisma.costBreakdown.aggregate({
      where: { expenseRequest: { status: ExpenseRequestStatus.EM_PROCESSAMENTO } },
      _sum: { amount: true },
    })

    const realUsed = dbProjects.reduce((acc, proj) => acc + Number(proj.usedBudget), 0)
    const pendingAmount = Number(dbPending._sum.amount || 0)
    const expectedBudgetCommitted = (realUsed + pendingAmount).toString()

    expect(typeof json.totalValue).toBe('string')
    expect(typeof json.budgetCommitted).toBe('string')
    expect(json.totalValue).toBe(expectedTotalValue)
    expect(json.budgetCommitted).toBe(expectedBudgetCommitted)
  })
})
