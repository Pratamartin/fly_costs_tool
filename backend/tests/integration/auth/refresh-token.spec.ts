import { testClient } from 'hono/testing'
import { parse } from 'hono/utils/cookie'
import * as status from 'stoker/http-status-codes'
import { afterAll, afterEach, assert, beforeAll, describe, expect, it, vi } from 'vitest'
import { createTestApp } from '@/lib/config'
import prisma from '@/lib/orm'
import { auth, me } from '@/routes'
import { seedUsers } from '@/seeds'
import { expectProblem } from '../../util/assertions'

// Mocking env to have a very short JWT expiration for testing SESSION_EXPIRED
vi.mock('@/env', async () => {
  const actual = await vi.importActual<typeof import('@/env')>('@/env')
  return {
    ...actual,
    default: {
      ...actual.default,
      JWT_EXPIRES_IN: 1, // 1 second
    },
  }
})

const client = testClient(createTestApp(auth).route('/', me))

describe('[Auth] Refresh Token Flow', () => {
  beforeAll(async () => {
    await seedUsers()
  })

  afterEach(async () => {
    await prisma.userSession.deleteMany()
    vi.useRealTimers()
  })

  afterAll(async () => {
    await prisma.userSession.deleteMany()
    await prisma.user.deleteMany()
    vi.restoreAllMocks()
  })

  it('deve realizar login e retornar accessToken no json e refreshToken no cookie', async () => {
    const res = await client.auth.login.$post({
      json: {
        email: 'aluno@test.com',
        password: 'Test@1234',
      },
    })

    assert(res.status === status.OK)

    const json = await res.json()
    expect(json.accessToken).toBeDefined()

    // Verificando Cookie
    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).toContain('refreshToken=')
    expect(setCookie).toContain('HttpOnly')
    expect(setCookie).toContain('SameSite=Lax')

    // Verificando persistência no banco
    const user = await prisma.user.findUnique({ where: { email: 'aluno@test.com' } })
    const session = await prisma.userSession.findFirst({ where: { userId: user!.id } })

    expect(session).not.toBeNull()
    expect(session?.revokedAt).toBeNull()
  })

  it('deve renovar o accessToken usando um refreshToken válido e estender a sessão (Sliding Session)', async () => {
    // 1. Faz login para pegar o cookie
    const loginRes = await client.auth.login.$post({
      json: {
        email: 'aluno@test.com',
        password: 'Test@1234',
      },
    })

    const setCookie = loginRes.headers.get('set-cookie')
    const cookies = parse(setCookie!)
    const refreshToken = cookies.refreshToken

    // Pega a data de expiração ANTES do refresh
    const sessionBefore = await prisma.userSession.findFirst({ where: { user: { email: 'aluno@test.com' } } })
    const expiresAtBefore = sessionBefore!.expiresAt.getTime()

    // Avança o tempo do sistema em 1 dia para forçar uma diferença clara na renovação
    vi.useFakeTimers()
    vi.setSystemTime(new Date(Date.now() + 24 * 60 * 60 * 1000))

    // 2. Tenta dar refresh
    const res = await client.auth.refresh.$post({}, { headers: { Cookie: `refreshToken=${refreshToken}` } })

    assert(res.status === status.OK)
    const json = await res.json()
    expect(json.accessToken).toBeDefined()

    // Pega a data de expiração DEPOIS do refresh
    const sessionAfter = await prisma.userSession.findFirst({ where: { user: { email: 'aluno@test.com' } } })
    const expiresAtAfter = sessionAfter!.expiresAt.getTime()

    // 3. Asserção da Sliding Session: a nova data de expiração deve ser maior
    expect(expiresAtAfter).toBeGreaterThan(expiresAtBefore)

    // Restaura o tempo
    vi.useRealTimers()
  })

  it('deve realizar logout e invalidar o refreshToken', async () => {
    // 1. Login
    const loginRes = await client.auth.login.$post({
      json: {
        email: 'aluno@test.com',
        password: 'Test@1234',
      },
    })

    const setCookie = loginRes.headers.get('set-cookie')
    const cookies = parse(setCookie!)
    const refreshToken = cookies.refreshToken

    // 2. Logout
    const logoutRes = await client.auth.logout.$post({}, { headers: { Cookie: `refreshToken=${refreshToken}` } })

    expect(logoutRes.status).toBe(status.OK)

    // Verificando se cookie de limpeza foi enviado
    const logoutCookie = logoutRes.headers.get('set-cookie')
    expect(logoutCookie).toContain('Max-Age=0')

    // 3. Tenta dar refresh (Deve falhar agora)
    const refreshRes = await client.auth.refresh.$post({}, { headers: { Cookie: `refreshToken=${refreshToken}` } })

    await expectProblem(refreshRes, 'UNAUTHORIZED')

    // Verificando no banco
    const revokedSession = await prisma.userSession.findFirst({ where: { revokedAt: { not: null } } })
    expect(revokedSession).not.toBeNull()
  })

  it('deve retornar SESSION_EXPIRED quando o access token expira', async () => {
    // 1. Login para obter o access token
    const loginRes = await client.auth.login.$post({
      json: {
        email: 'aluno@test.com',
        password: 'Test@1234',
      },
    })

    assert(loginRes.status === status.OK)
    const { accessToken } = await loginRes.json()

    // 2. Esperar o token expirar (1 segundo + margem)
    await new Promise(resolve => setTimeout(resolve, 1500))

    // 3. Tentar acessar uma rota protegida (/me)
    const res = await client.me.$get({}, { headers: { Authorization: `Bearer ${accessToken}` } })

    await expectProblem(res, 'SESSION_EXPIRED')
  })
})
