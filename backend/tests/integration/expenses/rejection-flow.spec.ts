import { testClient } from 'hono/testing'
import * as status from 'stoker/http-status-codes'
import { afterAll, assert, beforeAll, describe, expect, it } from 'vitest'
import { ExpenseRequestStatus } from '@/generated/prisma/enums'
import { createTestApp } from '@/lib/config'
import prisma from '@/lib/orm'
import { expenses } from '@/routes'
import { seedExpenseCategories, seedPreferenceSurveys, seedUsers } from '@/seeds'
import { dummyExpenseCategories } from '@/seeds/expense.category.seed'
import { getAuthHeaders } from '../../util'
import { expectProblem } from '../../util/assertions'

const client = testClient(createTestApp(expenses))

describe('[Expense Rejection Flow] - Create → Reject with Reason → Visualize', () => {
  let alunoHeaders: { Authorization: string }
  let coordenadorHeaders: { Authorization: string }
  let createdExpenseId: string
  const categoryId = dummyExpenseCategories[0]!.id!
  const rejectionReason = 'O aluno solicitante excedeu o limite semestral de benefícios.'

  beforeAll(async () => {
    await seedUsers()
    await seedExpenseCategories()
    await seedPreferenceSurveys()

    alunoHeaders = await getAuthHeaders('aluno@test.com', 'ALUNO')
    coordenadorHeaders = await getAuthHeaders('coordenador@test.com', 'COORDENADOR')
  })

  afterAll(async () => {
    await prisma.preferenceSurveyAnswer.deleteMany()
    await prisma.expenseRequest.deleteMany()
    await prisma.preferenceSurvey.deleteMany()
    await prisma.expenseCategory.deleteMany()
    await prisma.user.deleteMany()
  })

  it('[Step 1] Aluno cria uma solicitação de despesa', async () => {
    const expenseData = {
      title: 'Inscrição - SBSC 2026',
      event: {
        name: 'Evento Teste',
        location: 'Local Teste',
      },
      article: { classification: 'Sem Qualis' },
      description: 'Inscrição para apresentação de artigo aceito no Simpósio Brasileiro de Sistemas Colaborativos.',
      surveyAnswers: [
        {
          expenseCategoryId: categoryId,
          data: { invoiceKey: 'formulario-preferencias/aluno-uuid/invoice.pdf' },
        },
      ],
    }

    const res = await client.expenses.$post(
      { json: expenseData },
      { headers: alunoHeaders },
    )

    expect(res.status).toBe(status.CREATED)
    assert(res.status === status.CREATED)
    const json = await res.json()
    createdExpenseId = json.id
  })

  describe('validações Semânticas AJV (Metadados Dinâmicos)', () => {
    it('deve falhar se faltar propriedade obrigatória no evento (name)', async () => {
      const res = await client.expenses.$post({
        json: {
          title: 'Título',
          event: { location: 'Rio de Janeiro' },
          article: { classification: 'A1' },
          surveyAnswers: [{
            expenseCategoryId: categoryId,
            data: {},
          }],
        },
      }, { headers: alunoHeaders })

      const json = await expectProblem(res, 'VALIDATION_ERROR')
      const error = json.errors.find(e => e.field === 'event')
      assert(error)
      expect(error.code).toBe('invalid_type')
      expect(error.params).toMatchObject({ missingProperty: 'name' })
    })

    it('deve falhar se o tamanho mínimo for violado no evento (name < 3)', async () => {
      const res = await client.expenses.$post({
        json: {
          title: 'Título',
          event: {
            name: 'Oi',
            location: 'RJ',
          },
          article: { classification: 'A1' },
          surveyAnswers: [{
            expenseCategoryId: categoryId,
            data: {},
          }],
        },
      }, { headers: alunoHeaders })

      const json = await expectProblem(res, 'VALIDATION_ERROR')
      const error = json.errors.find(e => e.field === 'event.name')
      assert(error)
      expect(error.code).toBe('too_small')
      expect(error.params).toMatchObject({ min: 3 })
    })
  })

  it('[Extra] Coordenador tenta rejeitar SEM MOTIVO (Falha Semântica)', async () => {
    const res = await client.expenses[':id'].status.$patch(
      {
        param: { id: createdExpenseId },
        json: {
          status: ExpenseRequestStatus.REJEITADO,
          reason: '',
        },
      },
      { headers: coordenadorHeaders },
    )

    const json = await expectProblem(res, 'VALIDATION_ERROR')
    const errorField = json.errors.find(e => e.field === 'reason')
    assert(errorField)
    expect(errorField.code).toBe('custom')
    expect(errorField.params).toHaveProperty('requiredForStatuses')
  })

  it('[Step 2] Coordenador rejeita a solicitação COM MOTIVO', async () => {
    const res = await client.expenses[':id'].status.$patch(
      {
        param: { id: createdExpenseId },
        json: {
          status: ExpenseRequestStatus.REJEITADO,
          reason: rejectionReason,
        },
      },
      { headers: coordenadorHeaders },
    )

    expect(res.status).toBe(status.OK)
    assert(res.status === status.OK)
    const json = await res.json()

    expect(json.status).toBe(ExpenseRequestStatus.REJEITADO)
    expect(json.rejectionReason).toBe(rejectionReason)
  })

  it('[Step 3] Aluno visualiza a solicitação rejeitada com o motivo', async () => {
    const res = await client.expenses[':id'].$get(
      { param: { id: createdExpenseId } },
      { headers: alunoHeaders },
    )

    expect(res.status).toBe(status.OK)
    assert(res.status === status.OK)
    const json = await res.json()

    expect(json.status).toBe(ExpenseRequestStatus.REJEITADO)
    expect(json.rejectionReason).toBe(rejectionReason)
    expect(json.title).toBe('Inscrição - SBSC 2026')
  })

  it('[Step 4] Validar que a rejeição é definitiva - tenta rejeitar novamente', async () => {
    const res = await client.expenses[':id'].status.$patch(
      {
        param: { id: createdExpenseId },
        json: {
          status: ExpenseRequestStatus.REJEITADO,
          reason: 'Tentando rejeitar novamente',
        },
      },
      { headers: coordenadorHeaders },
    )

    await expectProblem(res, 'INVALID_TRANSITION')
  })

  it('[Step 5] Aluno não consegue editar uma despesa rejeitada (sem acesso ao endpoint de atualização de status)', async () => {
    const res = await client.expenses[':id'].status.$patch(
      {
        param: { id: createdExpenseId },
        json: { status: ExpenseRequestStatus.PENDENTE as any },
      },
      { headers: alunoHeaders },
    )

    await expectProblem(res, 'FORBIDDEN')
  })

  it('[Step 6] Validar lista de despesas - aluno pode visualizar a rejeitada', async () => {
    const res = await client.expenses.$get({ query: {} }, { headers: alunoHeaders })

    expect(res.status).toBe(status.OK)
    assert(res.status === status.OK)
    const json = await res.json()
    const rejectedExpense = json.find((exp: any) => exp.id === createdExpenseId)

    assert(rejectedExpense)
    expect(rejectedExpense.status).toBe(ExpenseRequestStatus.REJEITADO)
    expect(rejectedExpense.rejectionReason).toBe(rejectionReason)
  })
})
