import { testClient } from 'hono/testing'
import * as status from 'stoker/http-status-codes'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestApp } from '@/lib/config'
import prisma from '@/lib/orm'
import { me } from '@/routes'
import { UserProfileSchema } from '@/schemas/user.schema'
import { seedUsers } from '@/seeds'
import { getAuthHeaders } from '../../util'

const client = testClient(createTestApp(me))

describe('rota de Perfil (GET /me)', () => {
  let alunoHeaders: { Authorization: string }
  const alunoEmail = 'aluno@test.com'

  beforeAll(async () => {
    await seedUsers()
    alunoHeaders = await getAuthHeaders(alunoEmail, 'ALUNO')
  })

  afterAll(async () => {
    await prisma.user.deleteMany()
  })

  const endpoint = client.me

  it('deve retornar 401 quando o token não é fornecido', async () => {
    const res = await endpoint.$get()
    expect(res.status).toBe(status.UNAUTHORIZED)
  })

  it('deve retornar 200 e os dados do perfil do aluno autenticado', async () => {
    const res = await endpoint.$get({}, { headers: alunoHeaders })

    expect(res.status).toBe(status.OK)

    if (res.status === status.OK) {
      const json = await res.json()
      const data = UserProfileSchema.parse(json)
      expect(data.email).toBe(alunoEmail)
      expect(data.role).toBe('ALUNO')
      expect(data).toHaveProperty('id')
      expect(data).toHaveProperty('name')
    }
  })

  it('deve retornar 404 se o usuário do token for deletado do banco', async () => {
    // Simulamos um cenário onde o token ainda é válido (tempo),
    // mas o usuário foi removido do BD
    await prisma.user.delete({ where: { email: alunoEmail } })

    const res = await endpoint.$get({}, { headers: alunoHeaders })

    expect(res.status).toBe(status.NOT_FOUND)
  })
})
