import type { z } from '@hono/zod-openapi'
import type { RegisterSchema } from '@/schemas/auth.schema'
import { testClient } from 'hono/testing'
import * as status from 'stoker/http-status-codes'
import { afterAll, assert, beforeAll, describe, expect, it } from 'vitest'
import { MOCK_PROFILE, MOCK_USER } from '@/constants/seed.constant'
import { UserRole } from '@/generated/prisma/enums'
import { createTestApp } from '@/lib/config'
import prisma from '@/lib/orm'
import { auth } from '@/routes'
import { seedInviteCodes } from '@/seeds'

const client = testClient(createTestApp(auth))

describe('[Auth] Cadastro de usuário', () => {
  const endpoint = client.auth.register

  const basePayload: z.infer<typeof RegisterSchema> = {
    ...MOCK_USER,
    ...MOCK_PROFILE,
    email: 'aluno.teste@example.com',
    role: UserRole.ALUNO,
    birthDate: new Date(MOCK_PROFILE.birthDate),
  }

  beforeAll(async () => {
    await seedInviteCodes()
  })

  afterAll(async () => {
    await prisma.user.delete({ where: { email: basePayload.email } }).catch(() => {})
    await prisma.inviteCode.deleteMany()
  })

  it('cadastra um aluno com dados de perfil com sucesso', async () => {
    const res = await endpoint.$post({ json: basePayload })

    assert(res.status === status.CREATED)
    const json = await res.json()
    expect(json).toHaveProperty('id')
    expect(json).toHaveProperty('email', basePayload.email)
    expect(json.role).toBe(UserRole.ALUNO)
    expect(json.profile).toBeDefined()
  })

  it('deve retornar erro ao tentar cadastrar com e-mail já existente', async () => {
    await endpoint.$post({ json: basePayload })

    const res = await endpoint.$post({ json: basePayload })

    assert(res.status === status.CONFLICT)
    const json = await res.json()

    expect(json).toHaveProperty('message')
  })

  it('deve retornar erro ao tentar cadastrar com código de convite inválido', async () => {
    const payloadConviteInvalido = {
      ...basePayload,
      email: 'outro.aluno@example.com',
      inviteCode: 'CODIGO_INVALIDO_999',
    }

    const res = await endpoint.$post({ json: payloadConviteInvalido })

    assert(res.status === status.BAD_REQUEST)
    const json = await res.json()

    expect(json).toHaveProperty('message')
  })
})
