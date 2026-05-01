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

describe('[Expense Rejection Flow] - Create → Reject with Reason → Visualize', () => {
  let alunoHeaders: { Authorization: string }
  let coordenadorHeaders: { Authorization: string }
  let createdExpenseId: string
  const rejectionReason = 'O aluno excedeu o limite semestral de benefícios.'

  beforeAll(async () => {
    await seedUsers()
    await seedExpenseCategories()
    await seedProjects()

    alunoHeaders = await getAuthHeaders('aluno@test.com', 'ALUNO')
    coordenadorHeaders = await getAuthHeaders('coordenador@test.com', 'COORDENADOR')
  })

  afterAll(async () => {
    await prisma.expenseRequest.deleteMany()
    await prisma.project.deleteMany()
    await prisma.user.deleteMany()
  })

  it('[Step 1] Aluno cria uma solicitação de despesa', async () => {
    const expenseData = {
      title: 'Inscrição - SBSC 2026',
      description: 'Inscrição para apresentação de artigo aceito no Simpósio Brasileiro de Sistemas Colaborativos.',
      city: 'São Paulo',
      state: 'BR-SP',
      country: 'BR',
      departureDate: new Date('2026-06-01'),
      returnDate: new Date('2026-06-05'),
    }

    const endpoint = client.expenses.$post
    const res = await endpoint(
      { json: expenseData },
      { headers: alunoHeaders },
    )

    assert(res.status === status.CREATED)
    const json = await res.json()

    expect(json).toHaveProperty('id')
    expect(json.status).toBe(ExpenseRequestStatus.PENDENTE)
    expect(json.title).toBe(expenseData.title)
    expect(json.rejectionReason).toBeNull()

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
    expect(json.id).toBe(createdExpenseId)
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
          reason: 'Outro motivo',
        },
      },
      { headers: coordenadorHeaders },
    )

    expect(res.status).toBe(status.CONFLICT)
    const json = await res.json()
    expect(json).toHaveProperty('message')
  })

  it('[Step 5] Aluno não consegue editar uma despesa rejeitada (sem acesso ao endpoint de atualização de status)', async () => {
    const endpoint = client.expenses[':id'].status.$patch
    const res = await endpoint(
      {
        param: { id: createdExpenseId },
        json: { status: ExpenseRequestStatus.APROVADO },
      },
      { headers: alunoHeaders },
    )

    expect(res.status).toBe(status.FORBIDDEN)
  })

  it('[Step 6] Validar lista de despesas - aluno pode visualizar a rejeitada', async () => {
    const endpoint = client.expenses.$get
    const res = await endpoint(
      { query: {} },
      { headers: alunoHeaders },
    )

    expect(res.status).toBe(status.OK)
    const json = await res.json()

    assert(Array.isArray(json))
    const rejectedExpense = json.find(exp => exp.id === createdExpenseId)

    assert(rejectedExpense)
    expect(rejectedExpense.status).toBe(ExpenseRequestStatus.REJEITADO)
    expect(rejectedExpense.rejectionReason).toBe(rejectionReason)
  })
})
