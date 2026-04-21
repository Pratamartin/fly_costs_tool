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

describe('rota de Listagem (GET /expenses)', () => {
  let alunoHeaders: { Authorization: string }
  let adminHeaders: { Authorization: string }
  let alunoId: string
  let outroAlunoId: string

  beforeAll(async () => {
    await seedUsers()
    alunoHeaders = await getAuthHeaders('aluno@test.com', 'ALUNO')
    adminHeaders = await getAuthHeaders('admin@test.com', 'ADMIN')

    const aluno = await getUserByEmail('aluno@test.com')
    alunoId = aluno!.id

    await createExpenseRequest(alunoId, {
      title: 'Minha Despesa 1',
      amount: 100,
      description: 'Teste',
      topic: ExpenseTopic.PASSAGEM,
    })

    const outro = await prisma.user.create({
      data: {
        email: 'outro-aluno@test.com',
        name: 'Outro',
        role: 'ALUNO',
        passwordHash: 'hash',
      },
    })
    outroAlunoId = outro.id

    await createExpenseRequest(outroAlunoId, {
      title: 'Despesa de Outro Aluno',
      amount: 200,
      description: 'Privado',
      topic: ExpenseTopic.HOSPEDAGEM,
    })
  })

  afterAll(async () => {
    await prisma.expenseRequest.deleteMany()
    await prisma.user.deleteMany()
  })

  const endpoint = client.expenses

  it('deve listar apenas as despesas do próprio aluno quando logado como ALUNO', async () => {
    const res = await endpoint.$get({ query: {} }, { headers: alunoHeaders })
    expect(res.status).toBe(status.OK)

    if (res.status === status.OK) {
      const json = await res.json()
      expect(Array.isArray(json)).toBe(true)
      expect(json.length).toBe(1)
      expect(json.at(0)?.title).toBe('Minha Despesa 1')
    }
  })

  it('deve listar todas as despesas do sistema quando logado como ADMIN', async () => {
    const res = await endpoint.$get({ query: {} }, { headers: adminHeaders })
    expect(res.status).toBe(status.OK)

    if (res.status === status.OK) {
      const json = await res.json()
      expect(json.length).toBeGreaterThanOrEqual(2)
      const temEstudante = json.some(item => item.student !== undefined)
      expect(temEstudante).toBe(true)
    }
  })

  it('deve filtrar por status corretamente usando query params', async () => {
    const res = await endpoint.$get({ query: { status: 'PENDENTE' } }, { headers: adminHeaders })
    expect(res.status).toBe(status.OK)

    if (res.status === status.OK) {
      const json = await res.json()
      expect(json.every(item => item.status === 'PENDENTE')).toBe(true)
    }
  })

  it('deve retornar lista vazia se o filtro não encontrar nada', async () => {
    const res = await endpoint.$get({ query: { status: 'REJEITADO' } }, { headers: adminHeaders })
    expect(res.status).toBe(status.OK)

    if (res.status === status.OK) {
      const json = await res.json()
      expect(json.length).toBe(0)
    }
  })
})
