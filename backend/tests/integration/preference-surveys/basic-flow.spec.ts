import { testClient } from 'hono/testing'
import * as status from 'stoker/http-status-codes'
import { afterAll, assert, beforeAll, describe, expect, it } from 'vitest'
import { createTestApp } from '@/lib/config'
import prisma from '@/lib/orm'
import { preferenceSurveys } from '@/routes'
import { seedExpenseCategories, seedPreferenceSurveys, seedUsers } from '@/seeds'
import { getAuthHeaders } from '../../util'
import { expectProblem } from '../../util/assertions'

const client = testClient(createTestApp(preferenceSurveys))

describe('[Preference Surveys API] - Gestão de Schemas Dinâmicos', () => {
  let alunoHeaders: { Authorization: string }

  beforeAll(async () => {
    await seedUsers()
    await seedExpenseCategories()
    await seedPreferenceSurveys()
    alunoHeaders = await getAuthHeaders('aluno@test.com', 'ALUNO')
  })

  afterAll(async () => {
    await prisma.preferenceSurvey.deleteMany()
    await prisma.expenseCategory.deleteMany()
    await prisma.user.deleteMany()
  })

  it('[SUCESSO]: Deve listar todas as pesquisas ativas', async () => {
    const res = await client['preference-surveys'].$get({ query: {} }, { headers: alunoHeaders })

    expect(res.status).toBe(status.OK)
    assert(res.status === status.OK)

    const json = await res.json()
    expect(Array.isArray(json)).toBe(true)
    expect(json.length).toBeGreaterThan(0)
    expect(json[0]).toHaveProperty('schema')
    expect(json[0]).toHaveProperty('expenseCategory')
    expect(json[0]?.expenseCategory).toHaveProperty('name')
  })

  it('[ERRO]: Deve bloquear acesso anônimo', async () => {
    const res = await client['preference-surveys'].$get({ query: {} })
    await expectProblem(res, 'UNAUTHORIZED')
  })

  it('[ERRO]: Deve retornar 422 para upload sem arquivo', async () => {
    const res = await client['preference-surveys'].upload.$post({
      // @ts-expect-error - testing invalid payload
      form: {},
    }, { headers: alunoHeaders })

    await expectProblem(res, 'VALIDATION_ERROR')
  })

  it('[ERRO]: Deve retornar 422 para download sem fileKey', async () => {
    const res = await client['preference-surveys'].download.$get({
      // @ts-expect-error - testing invalid query
      query: {},
    }, { headers: alunoHeaders })

    await expectProblem(res, 'VALIDATION_ERROR')
  })
})
