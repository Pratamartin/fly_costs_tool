import { cpf } from 'cpf-cnpj-validator'
import { testClient } from 'hono/testing'
import * as status from 'stoker/http-status-codes'
import { afterAll, assert, beforeAll, describe, expect, it } from 'vitest'
import { createTestApp } from '@/lib/config'
import prisma from '@/lib/orm'
import { me } from '@/routes'
import { seedUsers } from '@/seeds'
import { getAuthHeaders } from '../../util'

const client = testClient(createTestApp(me))

describe('[User Profile Flow] - Atualização de Perfil → Validação de CPF → Bloqueio de Admin', () => {
  let alunoHeaders: { Authorization: string }
  let adminHeaders: { Authorization: string }

  const cpfEmUso = cpf.generate()

  beforeAll(async () => {
    await seedUsers()
    alunoHeaders = await getAuthHeaders('aluno@test.com', 'ALUNO')
    adminHeaders = await getAuthHeaders('admin@test.com', 'ADMIN')

    await prisma.user.create({
      data: {
        name: 'Aluno do Conflito de CPF',
        email: 'conflito-cpf@test.com',
        passwordHash: 'hashed_pass',
        role: 'ALUNO',
        profile: { create: { cpf: cpfEmUso } },
      },
    })
  })

  afterAll(async () => {
    await prisma.user.deleteMany()
  })

  const patchEndpoint = client.me.$patch
  const getEndpoint = client.me.$get

  it('[Step 1] Usuário anônimo tenta atualizar perfil e é bloqueado', async () => {
    const res = await patchEndpoint({ json: { bankName: 'BANCO TESTE' } })
    expect(res.status).toBe(status.UNAUTHORIZED)
  })

  it('[Step 2] Aluno atualiza seus dados bancários com sucesso', async () => {
    const updatePayload = {
      bankCode: '001',
      bankName: 'BANCO DO BRASIL',
      bankAgency: '1234',
      bankAccount: '56789-0',
    }

    const res = await patchEndpoint(
      { json: updatePayload },
      { headers: alunoHeaders },
    )

    assert(res.status === status.OK)
    const json = await res.json()

    assert(json.profile)
    expect(json.profile.bankCode).toBe(updatePayload.bankCode)
    expect(json.profile.bankAccount).toBe('****89-0')
  })

  it('[Step 3] Aluno visualiza o próprio perfil e confirma a persistência dos dados', async () => {
    const res = await getEndpoint(
      {},
      { headers: alunoHeaders },
    )

    assert(res.status === status.OK)
    const json = await res.json()

    expect(json.profile).toBeDefined()
    expect(json.profile?.bankCode).toBe('001')
    expect(json.profile?.bankName).toBe('BANCO DO BRASIL')
  })

  it('[Step 4] Aluno tenta atualizar seu perfil usando um CPF que pertence a outro usuário', async () => {
    const res = await patchEndpoint(
      { json: { cpf: cpfEmUso } },
      { headers: alunoHeaders },
    )
    expect(res.status).toBe(status.CONFLICT)
    assert(res.status === status.CONFLICT)
    const json = await res.json()

    expect(json).toHaveProperty('message')
    expect(json.message).toContain('já está em uso')
  })

  it('[Step 5] Admin tenta adicionar dados bancários e é bloqueado pela regra de negócio', async () => {
    const res = await patchEndpoint(
      {
        json: {
          bankCode: '341',
          bankName: 'ITAU',
        },
      },
      { headers: adminHeaders },
    )

    assert(res.status === status.FORBIDDEN)
    const json = await res.json()

    expect(json).toHaveProperty('message')
    expect(json.message).toContain('Acesso negado')
  })

  it('[Step 6] Admin atualiza apenas o próprio nome com sucesso (permitido)', async () => {
    const newAdminName = 'flamingo admin'
    const res = await patchEndpoint(
      { json: { name: newAdminName } },
      { headers: adminHeaders },
    )

    expect(res.status).toBe(status.OK)
    assert(res.status === status.OK)
    const json = await res.json()

    expect(json.name).toBe(newAdminName)
    expect(json.profile).toBeNull()
  })
})
