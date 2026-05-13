import { testClient } from 'hono/testing'
import * as status from 'stoker/http-status-codes'
import { afterAll, assert, beforeAll, describe, expect, it } from 'vitest'
import { createTestApp } from '@/lib/config'
import prisma from '@/lib/orm'
import { analytics } from '@/routes'
import { seedExpenseCategories, seedUsers } from '@/seeds'
import seedExpenses, { dummyExpenses } from '@/seeds/expense.seed'
import seedProjects, { dummyProjects } from '@/seeds/project.seed'
import { getAuthHeaders } from '../../util'

const client = testClient(createTestApp(analytics))

describe('get /analytics/admin-dashboard', () => {
  let alunoHeaders: { Authorization: string }
  let adminHeaders: { Authorization: string }

  beforeAll(async () => {
    await seedUsers()
    await seedExpenseCategories()
    await seedProjects()
    await seedExpenses()
    alunoHeaders = await getAuthHeaders('aluno@test.com', 'ALUNO')
    adminHeaders = await getAuthHeaders('admin@test.com', 'ADMIN')
  })

  afterAll(async () => {
    await prisma.expenseRequest.deleteMany()
    await prisma.project.deleteMany()
    await prisma.user.deleteMany()
  })

  const endpoint = client.analytics['admin-dashboard']

  it('deve retornar 401 quando nenhum token é fornecido', async () => {
    const res = await endpoint.$get({ query: {} })
    expect(res.status).toBe(status.UNAUTHORIZED)
  })

  it('deve retornar 403 quando um ALUNO tenta acessar o dashboard', async () => {
    const res = await endpoint.$get({ query: {} }, { headers: alunoHeaders })
    expect(res.status).toBe(status.FORBIDDEN)
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

    const expectedBudgetCommitted = dummyProjects
      .reduce((acc, proj) => acc + Number(proj.usedBudget ?? 0), 0)
      .toString()

    expect(typeof json.totalValue).toBe('string')
    expect(typeof json.budgetCommitted).toBe('string')
    expect(json.totalValue).toBe(expectedTotalValue)
    expect(json.budgetCommitted).toBe(expectedBudgetCommitted)
  })
})
