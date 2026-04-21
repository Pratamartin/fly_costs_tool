import { testClient } from 'hono/testing'
import * as status from 'stoker/http-status-codes'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ExpenseRequestStatus, ExpenseTopic } from '@/generated/prisma/client'
import { createTestApp } from '@/lib/config'
import prisma from '@/lib/orm'
import { expenses } from '@/routes'
import { seedUsers } from '@/seeds'
import { getUserByEmail } from '@/services/user.service'
import { getAuthHeaders } from '../../util'

const client = testClient(createTestApp(expenses))

describe('rota de status (PATCH /expenses/:id/status)', () => {
  let alunoHeaders: { Authorization: string }
  let adminHeaders: { Authorization: string }
  let coordenadorHeaders: { Authorization: string }
  let expenseId: string

  beforeAll(async () => {
    await seedUsers()
    alunoHeaders = await getAuthHeaders('aluno@test.com', 'ALUNO')
    adminHeaders = await getAuthHeaders('admin@test.com', 'ADMIN')
    coordenadorHeaders = await getAuthHeaders('coordenador@test.com', 'COORDENADOR')

    const expense = await prisma.expenseRequest.create({
      data: {
        title: 'Gasto Inicial',
        amount: 100,
        description: 'Teste',
        topic: ExpenseTopic.PASSAGEM,
        studentId: (await getUserByEmail('aluno@test.com'))!.id,
      },
    })
    expenseId = expense.id
  })

  afterAll(async () => {
    await prisma.expenseRequest.deleteMany()
    await prisma.user.deleteMany()
  })

  it('deve retornar 403 se um ALUNO tentar aprovar despesa', async () => {
    const res = await client.expenses[':id'].status.$patch({
      param: { id: expenseId },
      json: { status: ExpenseRequestStatus.APROVADO },
    }, { headers: alunoHeaders })

    expect(res.status).toBe(status.FORBIDDEN)
  })

  it('deve aprovar uma despesa com sucesso quando for COORDENADOR', async () => {
    const res = await client.expenses[':id'].status.$patch({
      param: { id: expenseId },
      json: { status: ExpenseRequestStatus.APROVADO },
    }, { headers: coordenadorHeaders })

    expect(res.status).toBe(status.OK)

    if (res.status === status.OK) {
      const json = await res.json()

      expect(json.id).toBe(expenseId)
      expect(json.status).toBe(ExpenseRequestStatus.APROVADO)

      const dbRecord = await prisma.expenseRequest.findUnique({ where: { id: expenseId } })

      expect(dbRecord).not.toBeNull()
      expect(Number(dbRecord?.amount)).toBe(100)
      expect(dbRecord?.status).toBe(ExpenseRequestStatus.APROVADO)
    }
  })

  it('deve retornar 409 (Conflict) se tentar alterar uma despesa que não é mais PENDENTE', async () => {
    const res = await client.expenses[':id'].status.$patch({
      param: { id: expenseId },
      json: { status: ExpenseRequestStatus.REJEITADO },
    }, { headers: adminHeaders })

    expect(res.status).toBe(status.CONFLICT)

    if (res.status === status.CONFLICT) {
      const json = await res.json()
      expect(json.message).toBe('Solicitação já foi decidida')
    }
  })

  it('deve retornar 404 para um ID inexistente', async () => {
    const res = await client.expenses[':id'].status.$patch({
      param: { id: '00000000-0000-0000-0000-000000000000' },
      json: { status: ExpenseRequestStatus.APROVADO },
    }, { headers: adminHeaders })

    expect(res.status).toBe(status.NOT_FOUND)
  })
})
