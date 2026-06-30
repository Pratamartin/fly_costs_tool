import { testClient } from 'hono/testing'
import * as status from 'stoker/http-status-codes'
import { afterAll, assert, beforeAll, describe, expect, it } from 'vitest'
import { UserRole } from '@/generated/prisma/enums'
import { createTestApp } from '@/lib/config'
import prisma from '@/lib/orm'
import { auth } from '@/routes'
import { expectProblem } from '../../util/assertions'

const client = testClient(createTestApp(auth))

describe('[Auth] Validação de Convite (Pre-flight)', () => {
  const endpoint = client.auth['verify-invite']

  let validCode: string
  let expiredCode: string
  let usedCode: string

  beforeAll(async () => {
    const valid = await prisma.inviteCode.create({
      data: {
        code: '1111AAAA',
        role: UserRole.ALUNO,
        expiresAt: new Date(Date.now() + 100000),
      },
    })
    validCode = valid.code

    const expired = await prisma.inviteCode.create({
      data: {
        code: '2222BBBB',
        role: UserRole.ALUNO,
        expiresAt: new Date(Date.now() - 100000),
      },
    })
    expiredCode = expired.code

    const used = await prisma.inviteCode.create({
      data: {
        code: '3333CCCC',
        role: UserRole.ALUNO,
        expiresAt: new Date(Date.now() + 100000),
        usedById: 'dummy-user-id',
        usedAt: new Date(),
      },
    })
    usedCode = used.code
  })

  afterAll(async () => {
    await prisma.inviteCode.deleteMany({ where: { code: { in: [validCode, expiredCode, usedCode] } } })
  })

  it('[SUCESSO] Retorna 200 OK e a role para um convite válido (mesmo em letras minúsculas)', async () => {
    const res = await endpoint[':code'].$get({ param: { code: validCode.toLowerCase() } })

    assert(res.status === status.OK)
    const json = await res.json()
    expect(json.role).toBe(UserRole.ALUNO)
    expect(json.expiresAt).toBeDefined()
    expect(typeof json.expiresAt).toBe('string')
    expect(res.headers.get('cache-control')).toBe('no-store, no-cache, must-revalidate')
  })

  it('[FALHA - 422] Rejeita formato inválido via Zod', async () => {
    const res = await endpoint[':code'].$get({ param: { code: 'INVAL12' } }) // Less than 8 chars
    assert(res.status === status.UNPROCESSABLE_ENTITY)
  })

  it('[FALHA - 404] Retorna INVITE_NOT_FOUND para código inexistente', async () => {
    const res = await endpoint[':code'].$get({ param: { code: 'FFFFFFFF' } })
    await expectProblem(res, 'INVITE_NOT_FOUND')
  })

  it('[FALHA - 409] Retorna INVITE_ALREADY_USED para código resgatado', async () => {
    const res = await endpoint[':code'].$get({ param: { code: usedCode } })
    await expectProblem(res, 'INVITE_ALREADY_USED')
  })

  it('[FALHA - 410] Retorna INVITE_ALREADY_EXPIRED se passou da data', async () => {
    const res = await endpoint[':code'].$get({ param: { code: expiredCode } })
    await expectProblem(res, 'INVITE_ALREADY_EXPIRED')
  })
})
