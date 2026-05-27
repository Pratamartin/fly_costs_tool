import { testClient } from 'hono/testing'
import * as status from 'stoker/http-status-codes'
import { afterAll, assert, beforeAll, describe, expect, it } from 'vitest'
import { ExpenseRequestStatus, UserRole } from '@/generated/prisma/enums'
import { createTestApp } from '@/lib/config'
import prisma from '@/lib/orm'
import { expenses } from '@/routes'
import { seedExpenseCategories, seedPreferenceSurveys, seedUsers } from '@/seeds'
import { getAuthHeaders } from '../../util'

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

    await createExpenseWithStatus('Pendente Test', ExpenseRequestStatus.PENDENTE)
    await createExpenseWithStatus('Aprovado Test', ExpenseRequestStatus.APROVADO)
    await createExpenseWithStatus('Rejeitado Test', ExpenseRequestStatus.REJEITADO)
    await createExpenseWithStatus('Em Edicao Test', ExpenseRequestStatus.EM_EDICAO)
    await createExpenseWithStatus('Em Processamento Test', ExpenseRequestStatus.EM_PROCESSAMENTO)
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
    assert(res.status === status.OK)
    const json = await res.json()
    expect(json).toHaveLength(5) // Todas as 5 criadas no beforeAll são do alunoId
  })

  it('coordenador visualiza despesas PENDENTE, APROVADO, REJEITADO', async () => {
    const res = await client.expenses.$get({ query: {} }, { headers: coordenadorHeaders })
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
    assert(res.status === status.OK)
    const json = await res.json()

    const statuses = json.map((e: any) => e.status)
    expect(statuses).toContain(ExpenseRequestStatus.APROVADO)
    expect(statuses).toContain(ExpenseRequestStatus.EM_EDICAO)
    expect(statuses).toContain(ExpenseRequestStatus.EM_PROCESSAMENTO)
    expect(statuses).not.toContain(ExpenseRequestStatus.PENDENTE)
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
    assert(res.status === status.NOT_FOUND) // Handler retorna NOT_FOUND se não for do aluno
  })
})
