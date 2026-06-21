import { testClient } from 'hono/testing'
import * as status from 'stoker/http-status-codes'
import { afterAll, assert, beforeAll, describe, expect, it, vi } from 'vitest'
import { ExpenseRequestStatus } from '@/generated/prisma/enums'
import { jobManager } from '@/jobs'
import { createTestApp } from '@/lib/config'
import prisma from '@/lib/orm'
import { expenses } from '@/routes'
import { seedExpenseCategories, seedPreferenceSurveys, seedUsers } from '@/seeds'
import { dummyExpenseCategories } from '@/seeds/expense.category.seed'
import seedProjects from '@/seeds/project.seed'
import { getAuthHeaders } from '../../util'
import { expectProblem } from '../../util/assertions'

const client = testClient(createTestApp(expenses))

describe('[Expense Correction Flow] - Create → EM_EDICAO → Update → APROVADO → EM_PROCESSAMENTO', () => {
  let alunoHeaders: { Authorization: string }
  let adminHeaders: { Authorization: string }
  let coordenadorHeaders: { Authorization: string }
  let createdExpenseId: string
  const inscricaoCategory = dummyExpenseCategories.find(c => c.normalizedName === 'inscricao')!
  const categoryId = inscricaoCategory.id!
  const correctionReason = 'Por favor, ajuste o título da despesa para condizer com o memorando.'

  beforeAll(async () => {
    await seedUsers()
    await seedExpenseCategories()
    await seedPreferenceSurveys()
    await seedProjects()

    alunoHeaders = await getAuthHeaders('aluno@test.com', 'ALUNO')
    adminHeaders = await getAuthHeaders('admin@test.com', 'ADMIN')
    coordenadorHeaders = await getAuthHeaders('coordenador@test.com', 'COORDENADOR')

    vi.spyOn(jobManager, 'emit').mockResolvedValue(undefined)
  })

  afterAll(async () => {
    await prisma.preferenceSurveyAnswer.deleteMany()
    await prisma.expenseRequest.deleteMany()
    await prisma.preferenceSurvey.deleteMany()
    await prisma.project.deleteMany()
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
          data: {},
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

  it('[Step 2] Coordenador aprova a solicitação', async () => {
    const res = await client.expenses[':id'].status.$patch(
      {
        param: { id: createdExpenseId },
        json: { status: ExpenseRequestStatus.APROVADO },
      },
      { headers: coordenadorHeaders },
    )

    expect(res.status).toBe(status.OK)
    assert(res.status === status.OK)
    const json = await res.json()
    expect(json.status).toBe(ExpenseRequestStatus.APROVADO)
  })

  it('[Step 2.1] Coordenador tenta mover para EM_EDICAO (deve falhar - apenas ADMIN)', async () => {
    const res = await client.expenses[':id'].status.$patch(
      {
        param: { id: createdExpenseId },
        json: {
          status: ExpenseRequestStatus.EM_EDICAO,
          reason: correctionReason,
        },
      },
      { headers: coordenadorHeaders },
    )

    await expectProblem(res, 'FORBIDDEN')
  })

  it('[Step 3] Admin move para EM_EDICAO com motivo', async () => {
    const res = await client.expenses[':id'].status.$patch(
      {
        param: { id: createdExpenseId },
        json: {
          status: ExpenseRequestStatus.EM_EDICAO,
          reason: correctionReason,
        },
      },
      { headers: adminHeaders },
    )

    expect(res.status).toBe(status.OK)
    assert(res.status === status.OK)
    const json = await res.json()

    expect(json.status).toBe(ExpenseRequestStatus.EM_EDICAO)
    expect(json.correctionReason).toBe(correctionReason)
  })

  it('[Step 4] Aluno edita a despesa (status volta para APROVADO)', async () => {
    const updateData = {
      title: 'Título Corrigido - SBSC 2026',
      event: {
        name: 'Evento Teste',
        location: 'Local Teste',
      },
      article: { classification: 'Sem Qualis' },
      surveyAnswers: [
        {
          expenseCategoryId: categoryId,
          data: { invoiceKey: 'formulario-preferencias/aluno-uuid/invoice-anexado-tardiamente.pdf' },
        },
      ],
    }

    const res = await client.expenses[':id'].$patch(
      {
        param: { id: createdExpenseId },
        json: updateData,
      },
      { headers: alunoHeaders },
    )

    expect(res.status).toBe(status.OK)
    assert(res.status === status.OK)
    const json = await res.json()

    expect(json.status).toBe(ExpenseRequestStatus.APROVADO)
    expect(json.title).toBe(updateData.title)
    expect(json.correctionReason).toBeNull()
    expect(json.surveyAnswers![0]!.data.invoiceKey).toBe('formulario-preferencias/aluno-uuid/invoice-anexado-tardiamente.pdf')
  })

  it('[Step 5] Admin move para EM_PROCESSAMENTO (vínculo de projeto)', async () => {
    const res = await client.expenses[':id']['start-processing'].$patch(
      {
        param: { id: createdExpenseId },
        json: {},
      },
      { headers: adminHeaders },
    )

    expect(res.status).toBe(status.OK)
    assert(res.status === status.OK)
    const json = await res.json()

    expect(json.status).toBe(ExpenseRequestStatus.EM_PROCESSAMENTO)
  })
})
