import { testClient } from 'hono/testing'
import * as status from 'stoker/http-status-codes'
import { afterAll, assert, beforeAll, describe, expect, it } from 'vitest'
import { ExpenseRequestStatus } from '@/generated/prisma/enums'
import { createTestApp } from '@/lib/config'
import prisma from '@/lib/orm'
import { expenses } from '@/routes'
import { seedExpenseCategories, seedUsers } from '@/seeds'
import seedProjects from '@/seeds/project.seed'
import { getAuthHeaders } from '../../util'

const client = testClient(createTestApp(expenses))

describe('[Expense Status] - Integridade de transição de status', () => {
  let alunoHeaders: { Authorization: string }
  let adminHeaders: { Authorization: string }
  let coordenadorHeaders: { Authorization: string }
  let projectId: string

  const createPendingExpense = async () => {
    const res = await client.expenses.$post(
      {
        json: {
          title: 'Viagem de Teste Isolado',
          city: 'Manaus',
          state: 'BR-AM',
          country: 'BR',
          departureDate: new Date('2026-07-01'),
          returnDate: new Date('2026-07-05'),
        },
      },
      { headers: alunoHeaders },
    )

    assert(res.status === status.CREATED)

    const json = await res.json()
    return json.id
  }

  beforeAll(async () => {
    await seedUsers()
    await seedExpenseCategories()
    await seedProjects()

    const project = await prisma.project.findFirst()
    projectId = project!.id

    alunoHeaders = await getAuthHeaders('aluno@test.com', 'ALUNO')
    adminHeaders = await getAuthHeaders('admin@test.com', 'ADMIN')
    coordenadorHeaders = await getAuthHeaders('coordenador@test.com', 'COORDENADOR')
  })

  afterAll(async () => {
    await prisma.expenseRequest.deleteMany()
    await prisma.project.deleteMany()
    await prisma.expenseCategory.deleteMany()
    await prisma.user.deleteMany()
  })

  it('[SUCESSO]: Aluno cria uma solicitação (PENDENTE)', async () => {
    const id = await createPendingExpense()
    expect(id).toBeDefined()
    expect(typeof id).toBe('string')
  })

  it('[PROIBIDO]: PENDENTE -> EM_PROCESSAMENTO (Deve aprovar antes)', async () => {
    const expenseId = await createPendingExpense()

    const res = await client.expenses[':id']['assign-project'].$patch(
      {
        param: { id: expenseId },
        json: { projectId },
      },
      { headers: adminHeaders },
    )

    assert(res.status === status.CONFLICT)
  })

  it('[PROIBIDO]: PENDENTE -> EM_EDICAO (Necessário aprovar)', async () => {
    const expenseId = await createPendingExpense()

    const res = await client.expenses[':id'].status.$patch(
      {
        param: { id: expenseId },
        json: {
          status: ExpenseRequestStatus.EM_EDICAO,
          reason: 'Ajuste algo',
        },
      },
      { headers: adminHeaders },
    )

    assert(res.status === status.CONFLICT)
  })

  it('[PROIBIDO]: REJEITADO -> APROVADO (Rejeição é definitiva)', async () => {
    const expenseId = await createPendingExpense()

    const rejectRes = await client.expenses[':id'].status.$patch(
      {
        param: { id: expenseId },
        json: {
          status: ExpenseRequestStatus.REJEITADO,
          reason: 'Rejeitado para teste',
        },
      },
      { headers: coordenadorHeaders },
    )
    assert(rejectRes.status === status.OK)

    const res = await client.expenses[':id'].status.$patch(
      {
        param: { id: expenseId },
        json: { status: ExpenseRequestStatus.APROVADO },
      },
      { headers: coordenadorHeaders },
    )
    assert(res.status === status.CONFLICT)
  })

  it('[PROIBIDO]: EM_PROCESSAMENTO -> EM_EDICAO (Solicitação já corrigida)', async () => {
    const expenseId = await createPendingExpense()

    const approveRes = await client.expenses[':id'].status.$patch(
      {
        param: { id: expenseId },
        json: { status: ExpenseRequestStatus.APROVADO },
      },
      { headers: coordenadorHeaders },
    )
    assert(approveRes.status === status.OK)

    const processRes = await client.expenses[':id']['assign-project'].$patch(
      {
        param: { id: expenseId },
        json: { projectId },
      },
      { headers: adminHeaders },
    )
    assert(processRes.status === status.OK)

    const res = await client.expenses[':id'].status.$patch(
      {
        param: { id: expenseId },
        json: {
          status: ExpenseRequestStatus.EM_EDICAO,
          reason: 'Tarde demais',
        },
      },
      { headers: adminHeaders },
    )
    assert(res.status === status.CONFLICT)
  })
})
