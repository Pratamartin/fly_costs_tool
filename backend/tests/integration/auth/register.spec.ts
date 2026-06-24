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
import { expectProblem } from '../../util/assertions'

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
    expect(json.profile).toMatchObject(MOCK_PROFILE)
  })

  it('deve retornar erro ao tentar cadastrar com e-mail já existente', async () => {
    await endpoint.$post({ json: basePayload })

    const res = await endpoint.$post({ json: basePayload })

    await expectProblem(res, 'EMAIL_ALREADY_EXISTS')
  })

  it('deve retornar erro ao tentar cadastrar com código de convite inválido', async () => {
    const payloadConviteInvalido = {
      ...basePayload,
      email: 'outro.aluno@example.com',
      inviteCode: 'CODIGO_INVALIDO_999',
    }

    const res = await endpoint.$post({ json: payloadConviteInvalido })

    await expectProblem(res, 'INVITE_NOT_FOUND')
  })

  describe('validações Semânticas (RFC 9457)', () => {
    it('deve retornar erro de validação para role inválida (invalid_union)', async () => {
      const res = await endpoint.$post({
        json: {
          ...basePayload,
          role: 'PRESIDENTE' as any,
        },
      })

      const json = await expectProblem(res, 'VALIDATION_ERROR')
      const errorField = json.errors.find(e => e.field === 'role')
      expect(errorField).toBeDefined()
      assert(errorField)
      expect(errorField.code).toBe('invalid_union')
      expect(errorField.params).toHaveProperty('discriminator', 'role')
    })

    it('deve retornar erro de validação para conta bancária inválida (regex custom)', async () => {
      const res = await endpoint.$post({
        json: {
          ...basePayload,
          email: 'regex@test.com',
          bankAccount: 'lixo-corrente',
        },
      })

      const json = await expectProblem(res, 'VALIDATION_ERROR')
      const errorField = json.errors.find(e => e.field === 'bankAccount')
      assert(errorField)
      expect(errorField.code).toBe('custom')
      expect(errorField.params).toMatchObject({ format: 'brazilian_account' })
    })

    it('deve retornar erro de validação para idade insuficiente (minAge)', async () => {
      const res = await endpoint.$post({
        json: {
          ...basePayload,
          email: 'kid@test.com',
          birthDate: new Date('2020-01-01'),
        },
      })

      const json = await expectProblem(res, 'VALIDATION_ERROR')
      const errorField = json.errors.find(e => e.field === 'birthDate')
      assert(errorField)
      expect(errorField.params).toMatchObject({ minAge: 18 })
    })
  })
})
