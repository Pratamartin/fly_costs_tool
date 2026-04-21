import { testClient } from 'hono/testing'
import * as status from 'stoker/http-status-codes'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ExpenseTopic } from '@/generated/prisma/enums'
import { createTestApp } from '@/lib/config'
import prisma from '@/lib/orm'
import { expenses } from '@/routes'
import { seedUsers } from '@/seeds'
import { getAuthHeaders } from '../../util'

const client = testClient(createTestApp(expenses))

describe('rota de criação (POST /expenses)', () => {
  let alunoHeaders: { Authorization: string }
  let adminHeaders: { Authorization: string }

  beforeAll(async () => {
    await seedUsers()

    alunoHeaders = await getAuthHeaders('aluno@test.com', 'ALUNO')
    adminHeaders = await getAuthHeaders('admin@test.com', 'ADMIN')
  })

  afterAll(async () => {
    await prisma.expenseRequest.deleteMany()
    await prisma.user.deleteMany()
  })

  const endpoint = client.expenses

  describe('segurança e acesso', () => {
    it('deve retornar 401 quando nenhum token é fornecido', async () => {
      const response = await endpoint.$post({
        json: {
          title: 'Teste',
          amount: 100,
          topic: ExpenseTopic.PASSAGEM,
          description: 'Teste',
        },
      })
      expect(response.status).toBe(status.UNAUTHORIZED)
    })

    it('deve retornar 403 quando um ADMIN tenta criar despesa (restrito a ALUNO)', async () => {
      const response = await endpoint.$post({
        json: {
          title: 'Teste Admin',
          amount: 100,
          topic: ExpenseTopic.PASSAGEM,
          description: 'Teste',
        },
      }, { headers: adminHeaders })

      expect(response.status).toBe(status.FORBIDDEN)
    })
  })

  describe('quando o aluno envia dados válidos', () => {
    it('deve criar a despesa no banco e retornar 201', async () => {
      const payload = {
        title: 'Passagem para Conferência',
        amount: 1500.50,
        topic: ExpenseTopic.PASSAGEM,
        description: 'Ida para o Simpósio de Computação',
      }

      const response = await endpoint.$post({ json: payload }, { headers: alunoHeaders })

      expect(response.status).toBe(status.CREATED)

      if (response.status === status.CREATED) {
        const json = await response.json()
        expect(json.id).toBeDefined()
        expect(json.title).toBe(payload.title)
        expect(json.description).toBe(payload.description)
        expect(json.topic).toBe(payload.topic)

        expect(json.amount).toBe(payload.amount.toString())
        expect(json.status).toBe('PENDENTE')

        const savedInDb = await prisma.expenseRequest.findUnique({ where: { id: json.id } })
        expect(savedInDb).toBeTruthy()
        expect(savedInDb?.title).toBe(payload.title)
        expect(Number(savedInDb?.amount)).toBe(payload.amount)
      }
    })
  })

  describe('quando o payload é malformado (erros de validação)', () => {
    it('deve retornar 422 se a descrição não for enviada', async () => {
      const response = await endpoint.$post({
        // @ts-expect-error: Propriedade 'description' faltando para testar validação Zod
        json: {
          title: 'Sem descrição',
          amount: 100,
          topic: ExpenseTopic.INSCRICAO,
        },
      }, { headers: alunoHeaders })

      expect(response.status).toBe(status.UNPROCESSABLE_ENTITY)
    })

    it('deve retornar 422 se o valor (amount) for negativo', async () => {
      const response = await endpoint.$post({
        json: {
          title: 'Valor Negativo',
          description: 'Teste valor inválido',
          amount: -50,
          topic: ExpenseTopic.INSCRICAO,
        },
      }, { headers: alunoHeaders })

      expect(response.status).toBe(status.UNPROCESSABLE_ENTITY)
    })

    it('deve retornar 422 se o tópico for inválido', async () => {
      const response = await endpoint.$post({
        json: {
          title: 'Tópico Errado',
          description: 'Teste tópico',
          amount: 100,
          // @ts-expect-error: Valor fora do Enum
          topic: 'CHURRASCO',
        },
      }, { headers: alunoHeaders })

      expect(response.status).toBe(status.UNPROCESSABLE_ENTITY)
    })
  })
})
