import { testClient } from 'hono/testing'
import * as status from 'stoker/http-status-codes'
import { afterAll, assert, beforeAll, describe, expect, it } from 'vitest'
import { ExpenseRequestStatus, UserRole } from '@/generated/prisma/enums'
import { createTestApp } from '@/lib/config'
import prisma from '@/lib/orm'
import { expenses } from '@/routes'
import { seedExpenseCategories, seedPreferenceSurveys, seedUsers } from '@/seeds'
import { getAuthHeaders } from '../../util'
import { expectProblem } from '../../util/assertions'

const client = testClient(createTestApp(expenses))

describe('[Expense Visibility] - Role-based isolation', () => {
  let alunoHeaders: { Authorization: string }
  let adminHeaders: { Authorization: string }
  let coordenadorHeaders: { Authorization: string }
  let alunoId: string

  const createExpenseWithStatus = async (title: string, reqStatus: ExpenseRequestStatus) => {
    return prisma.expenseRequest.create({
      data: {
        title,
        status: reqStatus,
        event: {
          name: 'Evento Teste',
          location: 'Local Teste',
        },
        article: { classification: 'Sem Qualis' },
        studentId: alunoId,
      },
    })
  }

  beforeAll(async () => {
    await seedUsers()
    await seedExpenseCategories()
    await seedPreferenceSurveys()

    const aluno = await prisma.user.findFirst({ where: { role: UserRole.ALUNO } })
    assert(aluno)
    alunoId = aluno.id

    alunoHeaders = await getAuthHeaders('aluno@test.com', 'ALUNO')
    adminHeaders = await getAuthHeaders('admin@test.com', 'ADMIN')
    coordenadorHeaders = await getAuthHeaders('coordenador@test.com', 'COORDENADOR')

    await prisma.expenseRequest.deleteMany()

    const exp1 = await createExpenseWithStatus('Pendente Test', ExpenseRequestStatus.PENDENTE)
    await createExpenseWithStatus('Aprovado Test', ExpenseRequestStatus.APROVADO)
    await createExpenseWithStatus('Rejeitado Test', ExpenseRequestStatus.REJEITADO)
    await createExpenseWithStatus('Em Edicao Test', ExpenseRequestStatus.EM_EDICAO)
    await createExpenseWithStatus('Em Processamento Test', ExpenseRequestStatus.EM_PROCESSAMENTO)

    const survey = await prisma.preferenceSurvey.findFirst({ where: { expenseCategory: { normalizedName: 'passagem-aerea' } } })
    if (survey) {
      await prisma.preferenceSurveyAnswer.create({
        data: {
          expenseRequestId: exp1.id,
          surveyId: survey.id,
          data: {
            departureDate: '2026-06-25',
            returnDate: '2026-06-30',
            departureRoute: 'GRU -> JFK',
            returnRoute: 'JFK -> GRU',
          },
        },
      })
    }
  })

  afterAll(async () => {
    await prisma.preferenceSurveyAnswer.deleteMany()
    await prisma.expenseRequest.deleteMany()
    await prisma.preferenceSurvey.deleteMany()
    await prisma.expenseCategory.deleteMany()
    await prisma.user.deleteMany()
  })

  it('aluno visualiza apenas suas próprias despesas', async () => {
    const res = await client.expenses.$get({ query: {} }, { headers: alunoHeaders })
    expect(res.status).toBe(status.OK)
    assert(res.status === status.OK)
    const json = await res.json()
    expect(json).toHaveLength(5) // Todas as 5 criadas no beforeAll são do alunoId

    // Assert that surveyAnswers are returned in the list endpoint
    const expWithSurvey = json.find(e => e.title === 'Pendente Test')
    assert(expWithSurvey)
    expect(expWithSurvey).toHaveProperty('surveyAnswers')
    assert(expWithSurvey.surveyAnswers)
    expect(expWithSurvey.surveyAnswers.length).toBeGreaterThan(0)
    expect(expWithSurvey.surveyAnswers[0]?.data).toHaveProperty('departureDate', '2026-06-25')
  })

  it('coordenador visualiza despesas PENDENTE, APROVADO, REJEITADO', async () => {
    const res = await client.expenses.$get({ query: {} }, { headers: coordenadorHeaders })
    expect(res.status).toBe(status.OK)
    assert(res.status === status.OK)
    const json = await res.json()

    const statuses = json.map((e: any) => e.status)
    expect(statuses).toContain(ExpenseRequestStatus.PENDENTE)
    expect(statuses).toContain(ExpenseRequestStatus.APROVADO)
    expect(statuses).toContain(ExpenseRequestStatus.REJEITADO)
    expect(statuses).not.toContain(ExpenseRequestStatus.EM_EDICAO)
    expect(statuses).not.toContain(ExpenseRequestStatus.EM_PROCESSAMENTO)
  })

  it('admin visualiza despesas APROVADO, EM_EDICAO, EM_PROCESSAMENTO, CONCLUIDO', async () => {
    const res = await client.expenses.$get({ query: {} }, { headers: adminHeaders })
    expect(res.status).toBe(status.OK)
    assert(res.status === status.OK)
    const json = await res.json()

    const statuses = json.map((e: any) => e.status)
    expect(statuses).toContain(ExpenseRequestStatus.APROVADO)
    expect(statuses).toContain(ExpenseRequestStatus.EM_EDICAO)
    expect(statuses).toContain(ExpenseRequestStatus.EM_PROCESSAMENTO)
    expect(statuses).not.toContain(ExpenseRequestStatus.PENDENTE)
  })

  it('detalhe da despesa inclui departureDate e returnDate nas surveyAnswers', async () => {
    const list = await client.expenses.$get({ query: {} }, { headers: alunoHeaders })
    assert(list.status === status.OK)
    const listJson = await list.json()
    const target = listJson.find((e: any) => e.title === 'Pendente Test')
    assert(target, 'Despesa "Pendente Test" não encontrada na listagem')

    const res = await client.expenses[':id'].$get({ param: { id: target.id } }, { headers: alunoHeaders })
    expect(res.status).toBe(status.OK)
    assert(res.status === status.OK)
    const json = await res.json()

    const surveyWithDates = json.surveyAnswers?.find(
      (a: any) => typeof a.data === 'object' && a.data !== null && 'departureDate' in a.data,
    )
    assert(surveyWithDates, 'surveyAnswer com departureDate não encontrado no detalhe')
    expect((surveyWithDates.data as Record<string, string>).departureDate).toBe('2026-06-25')
    expect((surveyWithDates.data as Record<string, string>).returnDate).toBe('2026-06-30')
  })

  it('aluno não pode ver despesas de outros alunos (simulado)', async () => {
    // Cria despesa de outro aluno
    const outroAluno = await prisma.user.create({
      data: {
        name: 'Outro Aluno',
        email: 'outro@test.com',
        passwordHash: 'hash',
        role: UserRole.ALUNO,
      },
    })

    const despesaOutro = await prisma.expenseRequest.create({
      data: {
        title: 'Despesa Outro',
        event: {
          name: 'Evento Teste',
          location: 'Local Teste',
        },
        article: { classification: 'Sem Qualis' },
        studentId: outroAluno.id,
      },
    })

    // Tenta acessar via ID
    const res = await client.expenses[':id'].$get({ param: { id: despesaOutro.id } }, { headers: alunoHeaders })
    await expectProblem(res, 'FORBIDDEN')
  })
})
