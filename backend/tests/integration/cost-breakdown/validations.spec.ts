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
        projectId: ID_PROJ_IA,
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
          subcategoryName: 'CATEGORIA_QUE_NAO_EXISTE',
        },
      },
      { headers: adminHeaders },
    )

    await expectProblem(res, 'INVALID_SUBCATEGORIES')
  })
})
