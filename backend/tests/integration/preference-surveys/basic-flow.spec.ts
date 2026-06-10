import { testClient } from 'hono/testing'
import * as status from 'stoker/http-status-codes'
import { afterAll, assert, beforeAll, describe, expect, it } from 'vitest'
import { ZodIssueCode } from 'zod'
import { createTestApp } from '@/lib/config'
import prisma from '@/lib/orm'
import { expenses, preferenceSurveys } from '@/routes'
import { seedExpenseCategories, seedPreferenceSurveys, seedUsers } from '@/seeds'
import { getAuthHeaders } from '../../util'
import { expectProblem } from '../../util/assertions'

const client = testClient(createTestApp(preferenceSurveys))
const expensesClient = testClient(createTestApp(expenses))

describe('[Preference Surveys API] - Gestão de Schemas Dinâmicos', () => {
  let alunoHeaders: { Authorization: string }
  let passagemCategoryId: string
  let inscricaoCategoryId: string

  beforeAll(async () => {
    await seedUsers()
    await seedExpenseCategories()
    await seedPreferenceSurveys()
    alunoHeaders = await getAuthHeaders('aluno@test.com', 'ALUNO')

    const passagem = await prisma.expenseCategory.findFirst({ where: { normalizedName: 'passagem-aerea' } })
    const inscricao = await prisma.expenseCategory.findFirst({ where: { normalizedName: 'inscricao' } })
    passagemCategoryId = passagem!.id
    inscricaoCategoryId = inscricao!.id
  })

  afterAll(async () => {
    await prisma.preferenceSurveyAnswer.deleteMany()
    await prisma.expenseRequest.deleteMany()
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

  describe('validation Bridge (Contrato Zod em Schemas AJV)', () => {
    it('deve validar regras customizadas (dateAfter) com path completo em Dot Notation', async () => {
      const payload = {
        title: 'Viagem de Teste',
        event: {
          name: 'Evento X',
          location: 'Cidade Y',
        },
        article: { classification: 'A1' },
        surveyAnswers: [
          {
            expenseCategoryId: passagemCategoryId,
            data: {
              departureDate: '2026-06-10',
              returnDate: '2026-06-01', // Erro: Anterior à ida
              departureRoute: 'GIG-GRU',
              returnRoute: 'GRU-GIG',
            },
          },
        ],
      }

      const res = await expensesClient.expenses.$post({ json: payload }, { headers: alunoHeaders })
      const body = await expectProblem(res, 'VALIDATION_ERROR')
      const error = body.errors[0]
      assert(error)

      expect(error.field).toBe('surveyAnswers.0.data.returnDate')
      expect(error.code).toBe(ZodIssueCode.custom)
      expect(error.params).toMatchObject({ validation: 'dateAfter' })
    })

    it('deve validar erro de enum em campos estáticos (article.classification)', async () => {
      const payload = {
        title: 'Viagem de Teste',
        event: {
          name: 'Evento X',
          location: 'Cidade Y',
        },
        article: { classification: 'QUALIS_INVALIDO' }, // Erro de Enum
        surveyAnswers: [],
      }

      const res = await expensesClient.expenses.$post({ json: payload }, { headers: alunoHeaders })
      const body = await expectProblem(res, 'VALIDATION_ERROR')
      const error = body.errors[0]
      assert(error)

      expect(error.field).toBe('article.classification')
      expect(error.code).toBe(ZodIssueCode.invalid_value)
      expect(error.params).toHaveProperty('options')
    })

    it('deve validar campo obrigatório em objeto aninhado (event.name)', async () => {
      const payload = {
        title: 'Viagem de Teste',
        event: { location: 'Cidade Y' }, // Nome faltando
        article: { classification: 'A1' },
        surveyAnswers: [],
      }

      const res = await expensesClient.expenses.$post({ json: payload }, { headers: alunoHeaders })
      const body = await expectProblem(res, 'VALIDATION_ERROR')
      const error = body.errors[0]
      assert(error)

      expect(error.field).toBe('event.name')
      expect(error.code).toBe(ZodIssueCode.invalid_type)
    })

    it('deve validar o índice correto quando o erro ocorre na segunda categoria', async () => {
      const payload = {
        title: 'Viagem de Teste',
        event: {
          name: 'Evento X',
          location: 'Cidade Y',
        },
        article: { classification: 'A1' },
        surveyAnswers: [
          {
            expenseCategoryId: inscricaoCategoryId,
            data: { invoiceKey: 'formulario-preferencias/anexo.pdf' },
          }, // Válido
          {
            expenseCategoryId: passagemCategoryId,
            data: {
              departureDate: '2026-06-10',
              returnDate: '2026-06-01',
              departureRoute: 'GIG-GRU',
              returnRoute: 'GRU-GIG',
            }, // Erro aqui (index 1)
          },
        ],
      }

      const res = await expensesClient.expenses.$post({ json: payload }, { headers: alunoHeaders })
      const body = await expectProblem(res, 'VALIDATION_ERROR')
      const error = body.errors[0]
      assert(error)

      expect(error.field).toBe('surveyAnswers.1.data.returnDate')
    })
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
