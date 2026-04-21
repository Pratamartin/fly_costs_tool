import { testClient } from 'hono/testing'
import * as status from 'stoker/http-status-codes'
import { beforeEach, describe, expect, it } from 'vitest'
import { UserRole } from '@/generated/prisma/enums'
import { createTestApp } from '@/lib/config'
import prisma from '@/lib/orm'
import { auth } from '@/routes'
import { mockInviteCode } from '@/services/auth.service'

const client = testClient(createTestApp(auth))

describe('rota de registro (POST /auth/register)', () => {
  const endpoint = client.auth.register

  beforeEach(async () => {
    await prisma.user.deleteMany()
  })

  describe('quando os dados são válidos', () => {
    it('deve criar o usuário no banco e retornar status 201', async () => {
      const payload = {
        email: 'aluno@example.com',
        inviteCode: mockInviteCode,
        name: 'Codibentinho',
        password: 'Passw0rd2023#',
        role: UserRole.ALUNO,
      }

      const response = await endpoint.$post({ json: payload })

      expect(response.status).toBe(status.CREATED)

      if (response.status === status.CREATED) {
        const json = await response.json()
        expect(json).toHaveProperty('id')
        expect(json.email).toBe(payload.email)
        expect(json.name).toBe(payload.name)
        expect(json.role).toBe(payload.role)
        expect(json).not.toHaveProperty('passwordHash')

        const userInDb = await prisma.user.findUnique({ where: { email: 'aluno@example.com' } })
        expect(userInDb).toBeTruthy()
        expect(userInDb?.name).toBe('Codibentinho')
      }
    })
  })

  describe('quando há violação de regras de negócio', () => {
    it('deve falhar com 409 (Conflict) se o email já estiver em uso', async () => {
      await endpoint.$post({
        json: {
          email: 'duplicate@example.com',
          inviteCode: mockInviteCode,
          name: 'First User',
          password: 'Passw0rd2023#',
          role: 'ALUNO',
        },
      })

      const response = await endpoint.$post({
        json: {
          email: 'duplicate@example.com',
          inviteCode: mockInviteCode,
          name: 'Second User',
          password: 'DifferentPass123!',
          role: 'ALUNO',
        },
      })

      expect(response.status).toBe(status.CONFLICT)
    })

    it('deve falhar com 400 se o código de convite for inválido', async () => {
      const response = await endpoint.$post({
        json: {
          email: 'aluno2@example.com',
          inviteCode: 'CODIGO_FALSO_123',
          name: 'João',
          password: 'Passw0rd2023#',
          role: 'ALUNO',
        },
      })

      expect(response.status).toBe(status.BAD_REQUEST)
    })
  })

  describe('quando o payload falha na validação', () => {
    it('deve retornar 422 para senhas muito fracas', async () => {
      const response = await endpoint.$post({
        json: {
          email: 'aluno3@example.com',
          inviteCode: mockInviteCode,
          name: 'Maria',
          password: '123',
          role: 'ALUNO',
        },
      })

      expect(response.status).toBe(status.UNPROCESSABLE_ENTITY)
    })

    it('deve retornar 422 para formatos de role inválidos', async () => {
      const response = await endpoint.$post({
        json: {
          email: 'aluno4@example.com',
          inviteCode: mockInviteCode,
          name: 'Pedro',
          password: 'Passw0rd2023#',
          // @ts-expect-error: Valor fora do Enum de UserRole para testar validação
          role: 'HACKER',
        },
      })

      expect(response.status).toBe(status.UNPROCESSABLE_ENTITY)
    })
  })
})
