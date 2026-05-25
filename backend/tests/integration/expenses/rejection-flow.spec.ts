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
      description: 'Inscrição para apresentação de artigo aceito no Simpósio Brasileiro de Sistemas Colaborativos.',
      surveyAnswers: [
        {
          expenseCategoryId: categoryId,
          data: { invoiceKey: 'formulario-preferencias/aluno-uuid/invoice.pdf' },
        },
      ],
    }

    const endpoint = client.expenses.$post
    const res = await endpoint(
      { json: expenseData },
      { headers: alunoHeaders },
    )

    assert(res.status === status.CREATED)
    const json = await res.json()
    createdExpenseId = json.id
  })

  it('[Step 2] Coordenador rejeita a solicitação COM MOTIVO', async () => {
    const endpoint = client.expenses[':id'].status.$patch
    const res = await endpoint(
      {
        param: { id: createdExpenseId },
        json: {
          status: ExpenseRequestStatus.REJEITADO,
          reason: rejectionReason,
        },
      },
      { headers: coordenadorHeaders },
    )

    assert(res.status === status.OK)
    const json = await res.json()

    expect(json.status).toBe(ExpenseRequestStatus.REJEITADO)
    expect(json.rejectionReason).toBe(rejectionReason)
  })

  it('[Step 3] Aluno visualiza a solicitação rejeitada com o motivo', async () => {
    const endpoint = client.expenses[':id'].$get
    const res = await endpoint(
      { param: { id: createdExpenseId } },
      { headers: alunoHeaders },
    )

    assert(res.status === status.OK)
    const json = await res.json()

    expect(json.status).toBe(ExpenseRequestStatus.REJEITADO)
    expect(json.rejectionReason).toBe(rejectionReason)
    expect(json.title).toBe('Inscrição - SBSC 2026')
  })

  it('[Step 4] Validar que a rejeição é definitiva - tenta rejeitar novamente', async () => {
    const endpoint = client.expenses[':id'].status.$patch
    const res = await endpoint(
      {
        param: { id: createdExpenseId },
        json: {
          status: ExpenseRequestStatus.REJEITADO,
          reason: 'Tentando rejeitar novamente',
        },
      },
      { headers: coordenadorHeaders },
    )

    assert(res.status === status.CONFLICT)
    const json = await res.json()
    expect(json).toHaveProperty('message')
  })

  it('[Step 5] Aluno não consegue editar uma despesa rejeitada (sem acesso ao endpoint de atualização de status)', async () => {
    const endpoint = client.expenses[':id'].status.$patch
    const res = await endpoint(
      {
        param: { id: createdExpenseId },
        json: { status: ExpenseRequestStatus.PENDENTE as any },
      },
      { headers: alunoHeaders },
    )

    assert(res.status === status.FORBIDDEN)
  })

  it('[Step 6] Validar lista de despesas - aluno pode visualizar a rejeitada', async () => {
    const endpoint = client.expenses.$get
    const res = await endpoint({ query: {} }, { headers: alunoHeaders })

    assert(res.status === status.OK)
    const json = await res.json()
    const rejectedExpense = json.find((exp: any) => exp.id === createdExpenseId)

    assert(rejectedExpense)
    expect(rejectedExpense.status).toBe(ExpenseRequestStatus.REJEITADO)
    expect(rejectedExpense.rejectionReason).toBe(rejectionReason)
  })
})
