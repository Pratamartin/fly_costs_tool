import { testClient } from 'hono/testing'
import * as status from 'stoker/http-status-codes'
import { afterAll, assert, beforeAll, describe, expect, it } from 'vitest'
import { ExpenseRequestStatus, UserRole } from '@/generated/prisma/enums'
import { createTestApp } from '@/lib/config'
import prisma from '@/lib/orm'
import { expenses } from '@/routes'
import { seedExpenseCategories, seedUsers } from '@/seeds'
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
        studentId: alunoId,
        city: 'Test City',
        state: 'BR-SP',
        country: 'BR',
        departureDate: new Date(),
        returnDate: new Date(),
      },
    })
  }

  beforeAll(async () => {
    await seedUsers()
    await seedExpenseCategories()

    const aluno = await prisma.user.findFirst({ where: { role: UserRole.ALUNO } })
    alunoId = aluno!.id

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
    await prisma.expenseRequest.deleteMany()
    await prisma.user.deleteMany()
  })

  it('[ALUNO] deve visualizar todos os seus próprios registros', async () => {
    const res = await client.expenses.$get({ query: {} }, { headers: alunoHeaders })
    expect(res.status).toBe(status.OK)
    assert(res.status === status.OK)
    const json = await res.json()
    expect(json.length).toBe(5)
  })

  it('[COORDENADOR] deve visualizar apenas PENDENTE, APROVADO, REJEITADO', async () => {
    const res = await client.expenses.$get({ query: {} }, { headers: coordenadorHeaders })
    expect(res.status).toBe(status.OK)
    assert(res.status === status.OK)

    const json = await res.json()

    const statuses = json.map(e => e.status)
    expect(json.length).toBe(3)
    expect(statuses).toContain(ExpenseRequestStatus.PENDENTE)
    expect(statuses).toContain(ExpenseRequestStatus.APROVADO)
    expect(statuses).toContain(ExpenseRequestStatus.REJEITADO)
    expect(statuses).not.toContain(ExpenseRequestStatus.EM_EDICAO)
    expect(statuses).not.toContain(ExpenseRequestStatus.EM_PROCESSAMENTO)
  })

  it('[ADMIN] deve visualizar APROVADO, EM_PROCESSAMENTO, EM_EDICAO', async () => {
    const res = await client.expenses.$get({ query: {} }, { headers: adminHeaders })
    expect(res.status).toBe(status.OK)
    assert(res.status === status.OK)

    const json = await res.json()

    const statuses = json.map(e => e.status)
    expect(json.length).toBe(3)
    expect(statuses).toContain(ExpenseRequestStatus.APROVADO)
    expect(statuses).toContain(ExpenseRequestStatus.EM_PROCESSAMENTO)
    expect(statuses).toContain(ExpenseRequestStatus.EM_EDICAO)
    expect(statuses).not.toContain(ExpenseRequestStatus.REJEITADO)
    expect(statuses).not.toContain(ExpenseRequestStatus.PENDENTE)
  })

  it('[COORDENADOR] não deve conseguir acessar detalhes de EM_EDICAO via ID', async () => {
    const emEdicao = await prisma.expenseRequest.findFirst({ where: { status: ExpenseRequestStatus.EM_EDICAO } })

    const res = await client.expenses[':id'].$get({ param: { id: emEdicao!.id } }, { headers: coordenadorHeaders })
    expect(res.status).toBe(status.NOT_FOUND)
  })

  it('[ADMIN] não deve conseguir acessar detalhes de PENDENTE via ID', async () => {
    const pendente = await prisma.expenseRequest.findFirst({ where: { status: ExpenseRequestStatus.PENDENTE } })

    const res = await client.expenses[':id'].$get({ param: { id: pendente!.id } }, { headers: adminHeaders })
    expect(res.status).toBe(status.NOT_FOUND)
  })
})
