import type { z } from 'zod'
import type { UpdateExpenseSchema } from '@/schemas/expense.schema'
import { testClient } from 'hono/testing'
import * as status from 'stoker/http-status-codes'
import { afterAll, assert, beforeAll, describe, expect, it, vi } from 'vitest'
import { ExpenseRequestStatus } from '@/generated/prisma/enums'
import { jobManager } from '@/jobs'
import { createTestApp } from '@/lib/config'
import prisma from '@/lib/orm'
import { expenses } from '@/routes'
import { seedExpenseCategories, seedPreferenceSurveys, seedUsers } from '@/seeds'
import { dummyExpenseCategories } from '@/seeds/expense.category.seed'
import seedProjects from '@/seeds/project.seed'
import { getAuthHeaders } from '../../util'
import { expectProblem } from '../../util/assertions'

const client = testClient(createTestApp(expenses))

describe('[Expense Correction Flow] - Create → EM_EDICAO → Update → APROVADO → EM_PROCESSAMENTO', () => {
  let alunoHeaders: { Authorization: string }
  let adminHeaders: { Authorization: string }
  let coordenadorHeaders: { Authorization: string }
  let createdExpenseId: string
  const inscricaoCategory = dummyExpenseCategories.find(c => c.normalizedName === 'inscricao')!
  const categoryId = inscricaoCategory.id!
  const diariasCategory = dummyExpenseCategories.find(c => c.normalizedName === 'diarias')!
  const diariasCategoryId = diariasCategory.id!
  const passagemAereaCategory = dummyExpenseCategories.find(c => c.normalizedName === 'passagem-aerea')!
  const passagemAereaCategoryId = passagemAereaCategory.id!
  const correctionReason = 'Por favor, ajuste o título da despesa para condizer com o trabalho publicado.'

  beforeAll(async () => {
    await seedUsers()
    await seedExpenseCategories()
    await seedPreferenceSurveys()
    await seedProjects()

    alunoHeaders = await getAuthHeaders('aluno@test.com', 'ALUNO')
    adminHeaders = await getAuthHeaders('admin@test.com', 'ADMIN')
    coordenadorHeaders = await getAuthHeaders('coordenador@test.com', 'COORDENADOR')

    vi.spyOn(jobManager, 'emit').mockResolvedValue(undefined)
  })

  afterAll(async () => {
    await prisma.preferenceSurveyAnswer.deleteMany()
    await prisma.expenseRequest.deleteMany()
    await prisma.preferenceSurvey.deleteMany()
    await prisma.project.deleteMany()
    await prisma.expenseCategory.deleteMany()
    await prisma.user.deleteMany()
  })

  it('[Step 1] Aluno cria uma solicitação de despesa', async () => {
    const expenseData = {
      title: 'Inscrição - SBSC 2026',
      event: {
        name: 'Evento Teste',
        location: 'Local Teste',
      },
      article: { classification: 'Sem Qualis' },
      description: 'Inscrição para apresentação de artigo aceito no Simpósio Brasileiro de Sistemas Colaborativos.',
      surveyAnswers: [
        {
          expenseCategoryId: categoryId,
          data: {},
        },
        {
          expenseCategoryId: diariasCategoryId,
          data: { requested: false },
        },
        {
          expenseCategoryId: passagemAereaCategoryId,
          data: {
            departureDate: '2026-10-10',
            returnDate: '2026-10-15',
            departureRoute: 'Manaus/AM',
            returnRoute: 'Rio de Janeiro/RJ',
          },
        },
      ],
    }

    const res = await client.expenses.$post(
      { json: expenseData },
      { headers: alunoHeaders },
    )

    expect(res.status).toBe(status.CREATED)
    assert(res.status === status.CREATED)
    const json = await res.json()
    createdExpenseId = json.id
    expect(json.attachmentKey).toBeNull()
  })

  it('[Step 2] Coordenador aprova a solicitação', async () => {
    const res = await client.expenses[':id'].status.$patch(
      {
        param: { id: createdExpenseId },
        json: { status: ExpenseRequestStatus.APROVADO },
      },
      { headers: coordenadorHeaders },
    )

    expect(res.status).toBe(status.OK)
    assert(res.status === status.OK)
    const json = await res.json()
    expect(json.status).toBe(ExpenseRequestStatus.APROVADO)
  })

  it('[Step 2.1] Coordenador tenta mover para EM_EDICAO (deve falhar - apenas ADMIN)', async () => {
    const res = await client.expenses[':id'].status.$patch(
      {
        param: { id: createdExpenseId },
        json: {
          status: ExpenseRequestStatus.EM_EDICAO,
          reason: correctionReason,
        },
      },
      { headers: coordenadorHeaders },
    )

    await expectProblem(res, 'FORBIDDEN')
  })

  it('[Step 3] Admin move para EM_EDICAO com motivo', async () => {
    const res = await client.expenses[':id'].status.$patch(
      {
        param: { id: createdExpenseId },
        json: {
          status: ExpenseRequestStatus.EM_EDICAO,
          reason: correctionReason,
        },
      },
      { headers: adminHeaders },
    )

    expect(res.status).toBe(status.OK)
    assert(res.status === status.OK)
    const json = await res.json()

    expect(json.status).toBe(ExpenseRequestStatus.EM_EDICAO)
    expect(json.correctionReason).toBe(correctionReason)
  })

  describe('[Step 4] Aluno edita a despesa (várias vezes)', () => {
    it('edita apenas o título', async () => {
      const payload: z.infer<typeof UpdateExpenseSchema> = { title: 'Título Corrigido - Parte 1' }
      const res = await client.expenses[':id'].$patch(
        {
          param: { id: createdExpenseId },
          json: payload,
        },
        { headers: alunoHeaders },
      )

      expect(res.status).toBe(status.OK)
      assert(res.status === status.OK)
      const json = await res.json()

      expect(json.status).toBe(ExpenseRequestStatus.APROVADO)
      expect(json.title).toBe('Título Corrigido - Parte 1')
      expect(json.correctionReason).toBeNull()
    })

    it('edita apenas o evento e o artigo', async () => {
      // 1. Admin volta para EM_EDICAO
      await client.expenses[':id'].status.$patch(
        {
          param: { id: createdExpenseId },
          json: {
            status: ExpenseRequestStatus.EM_EDICAO,
            reason: 'ajustar evento',
          },
        },
        { headers: adminHeaders },
      )

      // 2. Aluno edita
      const payload: z.infer<typeof UpdateExpenseSchema> = {
        event: {
          name: 'Evento Teste 2',
          location: 'Local Teste 2',
        },
        article: { classification: 'A1' },
      }
      const res = await client.expenses[':id'].$patch(
        {
          param: { id: createdExpenseId },
          json: payload,
        },
        { headers: alunoHeaders },
      )

      expect(res.status).toBe(status.OK)
      assert(res.status === status.OK)
      const json = await res.json()

      expect(json.status).toBe(ExpenseRequestStatus.APROVADO)
      expect(json.correctionReason).toBeNull()
    })

    it('edita apenas as respostas de Inscrição (surveyAnswers)', async () => {
      // 1. Admin volta para EM_EDICAO
      await client.expenses[':id'].status.$patch(
        {
          param: { id: createdExpenseId },
          json: {
            status: ExpenseRequestStatus.EM_EDICAO,
            reason: 'ajustar respostas de inscrição',
          },
        },
        { headers: adminHeaders },
      )

      // 2. Aluno edita
      const payload: z.infer<typeof UpdateExpenseSchema> = {
        surveyAnswers: [
          {
            expenseCategoryId: categoryId,
            data: { invoiceKey: 'formulario-preferencias/aluno-uuid/invoice-anexado-tardiamente.pdf' },
          },
          {
            expenseCategoryId: diariasCategoryId,
            data: { requested: false },
          },
          {
            expenseCategoryId: passagemAereaCategoryId,
            data: {
              departureDate: '2026-10-10',
              returnDate: '2026-10-15',
              departureRoute: 'Manaus/AM',
              returnRoute: 'Rio de Janeiro/RJ',
            },
          },
        ],
      }
      const res = await client.expenses[':id'].$patch(
        {
          param: { id: createdExpenseId },
          json: payload,
        },
        { headers: alunoHeaders },
      )

      expect(res.status).toBe(status.OK)
      assert(res.status === status.OK)
      const json = await res.json()

      expect(json.status).toBe(ExpenseRequestStatus.APROVADO)
      expect(json.correctionReason).toBeNull()
      const inscricaoAnswer = json.surveyAnswers!.find(a => typeof a.data === 'object' && a.data !== null && 'invoiceKey' in a.data)
      expect((inscricaoAnswer!.data).invoiceKey).toBe('formulario-preferencias/aluno-uuid/invoice-anexado-tardiamente.pdf')
      const diariasAnswerFalse = json.surveyAnswers!.find(a => typeof a.data === 'object' && a.data !== null && 'requested' in a.data)
      expect((diariasAnswerFalse!.data as Record<string, boolean>).requested).toBe(false)
    })

    it('edita apenas as respostas de Diárias para true (surveyAnswers)', async () => {
      // 1. Admin volta para EM_EDICAO
      await client.expenses[':id'].status.$patch(
        {
          param: { id: createdExpenseId },
          json: {
            status: ExpenseRequestStatus.EM_EDICAO,
            reason: 'ajustar respostas de diárias',
          },
        },
        { headers: adminHeaders },
      )

      // 2. Aluno edita
      const payload: z.infer<typeof UpdateExpenseSchema> = {
        surveyAnswers: [
          {
            expenseCategoryId: categoryId,
            data: { invoiceKey: 'formulario-preferencias/aluno-uuid/invoice-anexado-tardiamente.pdf' },
          },
          {
            expenseCategoryId: diariasCategoryId,
            data: { requested: true },
          },
          {
            expenseCategoryId: passagemAereaCategoryId,
            data: {
              departureDate: '2026-10-10',
              returnDate: '2026-10-15',
              departureRoute: 'Manaus/AM',
              returnRoute: 'Rio de Janeiro/RJ',
            },
          },
        ],
      }
      const resPatch = await client.expenses[':id'].$patch(
        {
          param: { id: createdExpenseId },
          json: payload,
        },
        { headers: alunoHeaders },
      )

      expect(resPatch.status).toBe(status.OK)
      assert(resPatch.status === status.OK)
      const jsonPatch = await resPatch.json()
      expect(jsonPatch.status).toBe(ExpenseRequestStatus.APROVADO)

      const diariasAnswer = jsonPatch.surveyAnswers!.find(a => typeof a.data === 'object' && a.data !== null && 'requested' in a.data)
      expect((diariasAnswer!.data as Record<string, boolean>).requested).toBe(true)
    })

    it('edita apenas as respostas de Passagem Aérea (surveyAnswers)', async () => {
      // 1. Admin volta para EM_EDICAO
      await client.expenses[':id'].status.$patch(
        {
          param: { id: createdExpenseId },
          json: {
            status: ExpenseRequestStatus.EM_EDICAO,
            reason: 'ajustar voo',
          },
        },
        { headers: adminHeaders },
      )

      // 2. Aluno edita a passagem aérea
      const payload: z.infer<typeof UpdateExpenseSchema> = {
        surveyAnswers: [
          {
            expenseCategoryId: categoryId,
            data: { invoiceKey: 'formulario-preferencias/aluno-uuid/invoice-anexado-tardiamente.pdf' },
          },
          {
            expenseCategoryId: diariasCategoryId,
            data: { requested: true },
          },
          {
            expenseCategoryId: passagemAereaCategoryId,
            data: {
              departureDate: '2026-10-12', // nova data
              returnDate: '2026-10-18', // nova data
              departureRoute: 'Manaus/AM',
              returnRoute: 'São Paulo/SP', // nova rota
            },
          },
        ],
      }
      const resPatch = await client.expenses[':id'].$patch(
        {
          param: { id: createdExpenseId },
          json: payload,
        },
        { headers: alunoHeaders },
      )

      expect(resPatch.status).toBe(status.OK)
      assert(resPatch.status === status.OK)
      const jsonPatch = await resPatch.json()
      expect(jsonPatch.status).toBe(ExpenseRequestStatus.APROVADO)

      const passagemAnswer = jsonPatch.surveyAnswers!.find(a => typeof a.data === 'object' && a.data !== null && 'departureRoute' in a.data)
      expect((passagemAnswer!.data as Record<string, string>).returnRoute).toBe('São Paulo/SP')
    })

    it('tenta editar as respostas de Diárias com data = {} (esperado erro de validação Ajv)', async () => {
      // 1. Admin volta para EM_EDICAO
      await client.expenses[':id'].status.$patch(
        {
          param: { id: createdExpenseId },
          json: {
            status: ExpenseRequestStatus.EM_EDICAO,
            reason: 'ajuste erro',
          },
        },
        { headers: adminHeaders },
      )

      // 2. Aluno edita (com formato inválido para Diárias que exige boolean)
      const payload: z.infer<typeof UpdateExpenseSchema> = {
        surveyAnswers: [
          {
            expenseCategoryId: categoryId,
            data: { invoiceKey: 'formulario-preferencias/aluno-uuid/invoice-anexado-tardiamente.pdf' },
          },
          {
            expenseCategoryId: diariasCategoryId,
            data: { requested: 'invalido' }, // Deve falhar pois requested tem que ser boolean
          },
          {
            expenseCategoryId: passagemAereaCategoryId,
            data: {
              departureDate: '2026-10-12',
              returnDate: '2026-10-18',
              departureRoute: 'Manaus/AM',
              returnRoute: 'São Paulo/SP',
            },
          },
        ],
      }
      const resPatch = await client.expenses[':id'].$patch(
        {
          param: { id: createdExpenseId },
          json: payload,
        },
        { headers: alunoHeaders },
      )

      await expectProblem(resPatch, 'VALIDATION_ERROR', {
        errors: [
          {
            field: 'surveyAnswers.1.data.requested',
            message: 'must be boolean',
          },
        ],
      })

      // 3. Restaura o estado para APROVADO com um patch válido para não quebrar o Step 5
      const resetPayload: z.infer<typeof UpdateExpenseSchema> = { title: 'Título Final Restaurado' }
      await client.expenses[':id'].$patch(
        {
          param: { id: createdExpenseId },
          json: resetPayload,
        },
        { headers: alunoHeaders },
      )
    })
  })

  it('[Step 5] Admin move para EM_PROCESSAMENTO (vínculo de projeto)', async () => {
    const res = await client.expenses[':id']['start-processing'].$patch(
      {
        param: { id: createdExpenseId },
        json: {},
      },
      { headers: adminHeaders },
    )

    expect(res.status).toBe(status.OK)
    assert(res.status === status.OK)
    const json = await res.json()

    expect(json.status).toBe(ExpenseRequestStatus.EM_PROCESSAMENTO)
  })
})
