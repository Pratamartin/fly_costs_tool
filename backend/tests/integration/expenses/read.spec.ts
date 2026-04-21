import { testClient } from 'hono/testing'
import * as status from 'stoker/http-status-codes'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ExpenseTopic } from '@/generated/prisma/client'
import { createTestApp } from '@/lib/config'
import prisma from '@/lib/orm'
import { expenses } from '@/routes'
import { seedUsers } from '@/seeds'
import { createExpenseRequest } from '@/services/expense.service'
import { getUserByEmail } from '@/services/user.service'
import { getAuthHeaders } from '../../util'

const client = testClient(createTestApp(expenses))

describe('rota de Leitura (GET /expenses/:id)', () => {
  let alunoHeaders: { Authorization: string }
  let adminHeaders: { Authorization: string }
  let expenseId: string
  let alunoId: string
  let outraExpenseId: string

  beforeAll(async () => {
    await seedUsers()
    alunoHeaders = await getAuthHeaders('aluno@test.com', 'ALUNO')
    adminHeaders = await getAuthHeaders('admin@test.com', 'ADMIN')

    const aluno = await getUserByEmail('aluno@test.com')
    alunoId = aluno!.id

    const expense = await createExpenseRequest(alunoId, {
      title: 'Gasto para Leitura',
      amount: 120.00,
      description: 'Teste de Read',
      topic: ExpenseTopic.HOSPEDAGEM,
    })
    expenseId = expense.id

    const outroAluno = await prisma.user.create({
      data: {
        email: 'outro@test.com',
        name: 'Outro Aluno',
        role: 'ALUNO',
        passwordHash: 'hash-qualquer',
      },
    })

    const outraDespesa = await createExpenseRequest(outroAluno.id, {
      title: 'Gasto Privado',
      amount: 50,
      description: 'Não deve ser acessível',
      topic: ExpenseTopic.PASSAGEM,
    })
    outraExpenseId = outraDespesa.id
  })

  afterAll(async () => {
    await prisma.expenseRequest.deleteMany()
    await prisma.user.deleteMany()
  })

  const endpoint = client.expenses[':id']

  it('deve retornar 200 e os detalhes da despesa para o dono (ALUNO)', async () => {
    const res = await endpoint.$get({ param: { id: expenseId } }, { headers: alunoHeaders })

    expect(res.status).toBe(status.OK)

    if (res.status === status.OK) {
      const json = await res.json()
      expect(json.id).toBe(expenseId)
      expect(json.title).toBe('Gasto para Leitura')
      expect(json.status).toBeDefined()
      expect(json.description).toBe('Teste de Read')
    }
  })

  it('deve retornar 404 se um ALUNO tentar ler uma despesa que não é dele', async () => {
    const res = await endpoint.$get({ param: { id: outraExpenseId } }, { headers: alunoHeaders })

    expect(res.status).toBe(status.NOT_FOUND)
  })

  it('deve permitir que um ADMIN leia qualquer despesa do sistema', async () => {
    const res = await endpoint.$get({ param: { id: outraExpenseId } }, { headers: adminHeaders })

    expect(res.status).toBe(status.OK)

    if (res.status === status.OK) {
      const json = await res.json()
      expect(json.id).toBe(outraExpenseId)
    }
  })

  it('deve retornar 404 para um ID que não existe no banco', async () => {
    const res = await endpoint.$get({ param: { id: '00000000-0000-0000-0000-000000000000' } }, { headers: adminHeaders })

    expect(res.status).toBe(status.NOT_FOUND)
  })
})
