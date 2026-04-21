import { testClient } from 'hono/testing'
import * as status from 'stoker/http-status-codes'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { DEFAULT_USER_PASSWORD } from '@/constants/seed.constant'
import { createTestApp } from '@/lib/config'
import prisma from '@/lib/orm'
import { auth } from '@/routes'
import { seedUsers } from '@/seeds'

const client = testClient(createTestApp(auth))

describe('rota de login (POST /auth/login)', () => {
  const endpoint = client.auth.login

  beforeAll(async () => {
    await seedUsers()
  })

  afterAll(async () => {
    await prisma.user.deleteMany()
  })

  describe('quando as credenciais são válidas', () => {
    it('deve autenticar o usuário e retornar o accessToken', async () => {
      const response = await endpoint.$post({
        json: {
          email: 'aluno@test.com',
          password: DEFAULT_USER_PASSWORD,
        },
      })

      expect(response.status).toBe(status.OK)
      if (response.status === status.OK) {
        const json = await response.json()
        expect(json).toHaveProperty('accessToken')
        expect(typeof json.accessToken).toBe('string')
        expect(json.accessToken.length).toBeGreaterThan(10)
      }
    })
  })

  describe('quando as credenciais são inválidas', () => {
    it('deve rejeitar o login com 401 para email não cadastrado', async () => {
      const response = await endpoint.$post({
        json: {
          email: 'user@nonregistered.com',
          password: 'Senh@3rrada',
        },
      })

      expect(response.status).toBe(status.UNAUTHORIZED)
    })

    it('deve rejeitar o login com 401 para senha incorreta', async () => {
      const response = await endpoint.$post({
        json: {
          email: 'aluno@test.com',
          password: `${DEFAULT_USER_PASSWORD}erro`,
        },
      })

      expect(response.status).toBe(status.UNAUTHORIZED)
    })
  })

  describe('quando o payload é malformado', () => {
    it('deve retornar erro 422 se o email tiver formato inválido', async () => {
      const response = await endpoint.$post({
        json: {
          email: 'nao-sou-um-email',
          password: DEFAULT_USER_PASSWORD,
        },
      })

      expect(response.status).toBe(status.UNPROCESSABLE_ENTITY)
    })
  })
})
