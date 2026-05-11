import { testClient } from 'hono/testing'
import * as status from 'stoker/http-status-codes'
import { afterAll, assert, beforeAll, describe, expect, it } from 'vitest'
import { UserRole } from '@/generated/prisma/enums'
import { createTestApp } from '@/lib/config'
import prisma from '@/lib/orm'
import { admin, auth } from '@/routes'
import { seedUsers } from '@/seeds'
import { getAuthHeaders } from '../../util'

const adminClient = testClient(createTestApp(admin))
const authClient = testClient(createTestApp(auth))

describe('[Invite Lifecycle Flow] Create → Validate → Consume → Block', () => {
  let adminHeaders: { Authorization: string }
  let studentHeaders: { Authorization: string }
  let createdInviteCode: string

  beforeAll(async () => {
    await seedUsers()
    adminHeaders = await getAuthHeaders('admin@test.com', 'ADMIN')
    studentHeaders = await getAuthHeaders('aluno@test.com', 'ALUNO')
  })

  afterAll(async () => {
    await prisma.inviteCode.deleteMany()
    await prisma.user.deleteMany({ where: { email: { in: ['new-student@test.com', 'another-student@test.com', 'revoked@test.com'] } } })
  })

  it('[Passo 1] ADMIN cria um convite para ALUNO', async () => {
    const res = await adminClient.admin.invites.$post(
      { json: { role: UserRole.ALUNO } },
      { headers: adminHeaders },
    )

    expect(res.status).toBe(status.CREATED)
    assert(res.status === status.CREATED)

    const json = await res.json()
    expect(json.code).toBeDefined()
    createdInviteCode = json.code
  })

  it('[Passo 2] ALUNO tenta criar convite e recebe 403', async () => {
    const res = await adminClient.admin.invites.$post(
      { json: { role: UserRole.ALUNO } },
      { headers: studentHeaders },
    )

    expect(res.status).toBe(status.FORBIDDEN)
    assert(res.status === status.FORBIDDEN)
  })

  it('[Passo 3] ADMIN visualiza o convite criado na listagem', async () => {
    const res = await adminClient.admin.invites.$get(
      { query: { search: createdInviteCode } },
      { headers: adminHeaders },
    )

    expect(res.status).toBe(status.OK)
    assert(res.status === status.OK)

    const json = await res.json()
    assert(Array.isArray(json))

    const exists = json.some(item =>
      typeof item === 'string' ? item === createdInviteCode : item.code === createdInviteCode,
    )
    expect(exists).toBe(true)
  })

  it('[Passo 4] Novo usuário se registra e consome o código', async () => {
    const res = await authClient.auth.register.$post({
      json: {
        name: 'New Student',
        email: 'new-student@test.com',
        password: 'Password123!',
        inviteCode: createdInviteCode,
        role: UserRole.ALUNO,
      },
    })

    expect(res.status).toBe(status.CREATED)
    assert(res.status === status.CREATED)

    const json = await res.json()
    expect(json.email).toBe('new-student@test.com')

    const inviteInDb = await prisma.inviteCode.findUnique({ where: { code: createdInviteCode } })
    assert(inviteInDb, 'O convite deveria existir no banco')
    expect(inviteInDb.usedById).toBe(json.id)
    expect(inviteInDb.usedAt).toBeDefined()
  })

  it('[Passo 5] Tentativa de usar o mesmo código novamente retorna 400', async () => {
    const res = await authClient.auth.register.$post({
      json: {
        name: 'Another Student',
        email: 'another-student@test.com',
        password: 'Password123!',
        role: UserRole.ALUNO,
        inviteCode: createdInviteCode,
      },
    })

    expect(res.status).toBe(status.BAD_REQUEST)
    assert(res.status === status.BAD_REQUEST)

    const json = await res.json()
    expect(json.message).toMatch(/inválido ou expirado/i)
  })

  it('[Passo 6] ADMIN não pode revogar um convite já utilizado', async () => {
    const invite = await prisma.inviteCode.findUnique({ where: { code: createdInviteCode } })
    assert(invite)

    const res = await adminClient.admin.invites[':id'].$delete(
      { param: { id: invite.id } },
      { headers: adminHeaders },
    )

    expect(res.status).toBe(status.CONFLICT)
    assert(res.status === status.CONFLICT)

    const json = await res.json()
    expect(json.message).toMatch(/já foi utilizado/i)
  })

  it('[Passo 7] ADMIN revoga um convite ATIVO e ele se torna inutilizável', async () => {
    const createRes = await adminClient.admin.invites.$post(
      { json: { role: UserRole.COORDENADOR } },
      { headers: adminHeaders },
    )
    expect(createRes.status).toBe(status.CREATED)
    assert(createRes.status === status.CREATED)
    const { id: inviteId, code: activeCode } = await createRes.json()

    const revokeRes = await adminClient.admin.invites[':id'].$delete(
      { param: { id: inviteId } },
      { headers: adminHeaders },
    )
    expect(revokeRes.status).toBe(status.NO_CONTENT)

    const registerRes = await authClient.auth.register.$post({
      json: {
        name: 'Revoked User',
        email: 'revoked@test.com',
        password: 'Password123!',
        role: UserRole.COORDENADOR,
        inviteCode: activeCode,
      },
    })

    expect(registerRes.status).toBe(status.BAD_REQUEST)
    assert(registerRes.status === status.BAD_REQUEST)

    const json = await registerRes.json()
    expect(json.message).toMatch(/inválido ou expirado/i)
  })
})
