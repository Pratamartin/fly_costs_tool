import { testClient } from 'hono/testing'
import * as status from 'stoker/http-status-codes'
import { assert, beforeAll, describe, expect, it } from 'vitest'
import { createTestApp } from '@/lib/config'
import { expenses } from '@/routes'
import { seedUsers } from '@/seeds'
import { getAuthHeaders } from '../../util'
import { expectProblem } from '../../util/assertions'

const client = testClient(createTestApp(expenses))

describe('[Expense Forms] - Teste de Contrato', () => {
  let authHeaders: { Authorization: string }
  const endpoint = client.expenses.forms

  beforeAll(async () => {
    await seedUsers()
    authHeaders = await getAuthHeaders('aluno@test.com', 'ALUNO')
  })

  it('deve retornar os formulários consolidados (schemas + ui)', async () => {
    const res = await endpoint.$get({}, { headers: authHeaders })

    expect(res.status).toBe(status.OK)
    assert(res.status === status.OK)
    const json = await res.json()

    expect(json).toHaveProperty('event')
    expect(json).toHaveProperty('article')

    expect(json.event).toHaveProperty('schema')
    assert(json.event.schema)
    expect(json.event).toHaveProperty('ui')
    assert(json.event.ui)

    expect(json.article).toHaveProperty('schema')
    expect(json.article).toHaveProperty('ui')

    // @ts-expect-error unknown title property
    expect(json.event.schema.title).toBe('Detalhes do Evento')
    expect(json.event.ui).toHaveProperty('type')
    // @ts-expect-error unknown group property
    expect(json.event.ui.type).toBe('Group')
  })

  it('deve retornar 401 se não estiver autenticado', async () => {
    const res = await endpoint.$get({})
    await expectProblem(res, 'UNAUTHORIZED')
  })
})
