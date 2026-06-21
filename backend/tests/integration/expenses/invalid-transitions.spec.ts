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

describe('[Expense Status] - Integridade de transição de status', () => {
  let alunoHeaders: { Authorization: string }
  let adminHeaders: { Authorization: string }
  let coordenadorHeaders: { Authorization: string }

  beforeAll(async () => {
    await seedUsers()
    await seedExpenseCategories()
    await seedPreferenceSurveys()

    alunoHeaders = await getAuthHeaders('aluno@test.com', 'ALUNO')
    adminHeaders = await getAuthHeaders('admin@test.com', 'ADMIN')
    coordenadorHeaders = await getAuthHeaders('coordenador@test.com', 'COORDENADOR')
  })

  afterAll(async () => {
    await prisma.preferenceSurveyAnswer.deleteMany()
    await prisma.expenseRequest.deleteMany()
    await prisma.preferenceSurvey.deleteMany()
    await prisma.expenseCategory.deleteMany()
    await prisma.user.deleteMany()
  })

  const createPendingExpense = async () => {
    const categoryId = dummyExpenseCategories[0]!.id!
    const expenseData = {
      title: 'Solicitação Status Test',
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
    }

    const res = await client.expenses.$post(
      { json: expenseData },
      { headers: alunoHeaders },
    )

    expect(res.status).toBe(status.CREATED)
    assert(res.status === status.CREATED)

    const json = await res.json()
    return json.id
  }

  it('[SUCESSO]: Aluno cria uma solicitação (PENDENTE)', async () => {
    const id = await createPendingExpense()
    expect(id).toBeDefined()
  })

  it('[PROIBIDO]: PENDENTE -> EM_PROCESSAMENTO (Deve aprovar antes)', async () => {
    const id = await createPendingExpense()

    const res = await client.expenses[':id']['start-processing'].$patch(
      {
        param: { id },
        json: {},
      },
      { headers: adminHeaders },
    )

    const json = await expectProblem(res, 'INVALID_EXPENSE_STATE')
    expect(json.resourceState).toMatchObject({
      current: ExpenseRequestStatus.PENDENTE,
      required: [ExpenseRequestStatus.APROVADO],
    })
  })

  it('[PROIBIDO]: PENDENTE -> EM_EDICAO (Necessário aprovar)', async () => {
    const id = await createPendingExpense()

    const res = await client.expenses[':id'].status.$patch(
      {
        param: { id },
        json: {
          status: ExpenseRequestStatus.EM_EDICAO,
          reason: 'teste',
        },
      },
      { headers: adminHeaders },
    )

    const json = await expectProblem(res, 'INVALID_TRANSITION')
    expect(json.resourceState).toMatchObject({
      current: ExpenseRequestStatus.PENDENTE,
      allowed: expect.arrayContaining([ExpenseRequestStatus.APROVADO, ExpenseRequestStatus.REJEITADO]),
    })
  })

  it('[PROIBIDO]: REJEITADO -> APROVADO (Rejeição é definitiva)', async () => {
    const id = await createPendingExpense()

    // 1. Rejeita
    const rejectRes = await client.expenses[':id'].status.$patch(
      {
        param: { id },
        json: {
          status: ExpenseRequestStatus.REJEITADO,
          reason: 'rejeitado',
        },
      },
      { headers: coordenadorHeaders },
    )
    assert(rejectRes.status === status.OK)

    // 2. Tenta aprovar
    const res = await client.expenses[':id'].status.$patch(
      {
        param: { id },
        json: { status: ExpenseRequestStatus.APROVADO },
      },
      { headers: coordenadorHeaders },
    )

    const json = await expectProblem(res, 'INVALID_TRANSITION')
    expect(json.resourceState).toMatchObject({
      current: ExpenseRequestStatus.REJEITADO,
      allowed: [],
    })
  })

  it('[PROIBIDO]: EM_PROCESSAMENTO -> EM_EDICAO (Solicitação já corrigida)', async () => {
    const id = await createPendingExpense()

    // 1. Aprova
    const approveRes = await client.expenses[':id'].status.$patch(
      {
        param: { id },
        json: { status: ExpenseRequestStatus.APROVADO },
      },
      { headers: coordenadorHeaders },
    )
    assert(approveRes.status === status.OK)

    // 2. Move para Em Processamento (Simula via DB para facilitar setup de projeto)
    await prisma.expenseRequest.update({
      where: { id },
      data: { status: ExpenseRequestStatus.EM_PROCESSAMENTO },
    })

    // 3. Tenta mover para EM_EDICAO
    const res = await client.expenses[':id'].status.$patch(
      {
        param: { id },
        json: {
          status: ExpenseRequestStatus.EM_EDICAO,
          reason: 'volta pra edição',
        },
      },
      { headers: adminHeaders },
    )

    const json = await expectProblem(res, 'INVALID_TRANSITION')
    expect(json.resourceState).toMatchObject({
      current: ExpenseRequestStatus.EM_PROCESSAMENTO,
      allowed: expect.arrayContaining([ExpenseRequestStatus.CONCLUIDO]),
    })
  })

  it('[PROIBIDO]: COORDENADOR tenta mover para EM_EDICAO (Apenas ADMIN pode)', async () => {
    const id = await createPendingExpense()

    // 1. Aprova
    await client.expenses[':id'].status.$patch(
      {
        param: { id },
        json: { status: ExpenseRequestStatus.APROVADO },
      },
      { headers: coordenadorHeaders },
    )

    // 2. Coordenador tenta mover para EM_EDICAO
    const res = await client.expenses[':id'].status.$patch(
      {
        param: { id },
        json: {
          status: ExpenseRequestStatus.EM_EDICAO,
          reason: 'tentativa proibida',
        },
      },
      { headers: coordenadorHeaders },
    )

    await expectProblem(res, 'FORBIDDEN')
  })
})
