import { testClient } from 'hono/testing'
import * as status from 'stoker/http-status-codes'
import { afterAll, assert, beforeAll, describe, expect, it, vi } from 'vitest'
import { MEMORANDUM_UPLOAD_MAX_SIZE_MB } from '@/constants/file.constant'
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

describe('[Expense Flow] - Ciclo de Conclusão de Despesa', () => {
  let alunoHeaders: { Authorization: string }
  let adminHeaders: { Authorization: string }
  let coordenadorHeaders: { Authorization: string }
  let projectId: string
  let subcategoryName: string
  const categoryId = dummyExpenseCategories[0]!.id!

  beforeAll(async () => {
    await seedUsers()
    await seedExpenseCategories()
    await seedPreferenceSurveys()
    await seedProjects()

    const project = await prisma.project.findFirst({ include: { expenseCategories: true } })
    assert(project && project.expenseCategories.length > 0, 'Project or categories not found')
    projectId = project.id
    subcategoryName = project.expenseCategories[0]!.normalizedName

    alunoHeaders = await getAuthHeaders('aluno@test.com', 'ALUNO')
    adminHeaders = await getAuthHeaders('admin@test.com', 'ADMIN')
    coordenadorHeaders = await getAuthHeaders('coordenador@test.com', 'COORDENADOR')

    vi.spyOn(jobManager, 'emit').mockResolvedValue(undefined)
  })

  afterAll(async () => {
    await prisma.preferenceSurveyAnswer.deleteMany()
    await prisma.costBreakdown.deleteMany()
    await prisma.expenseRequest.deleteMany()
    await prisma.preferenceSurvey.deleteMany()
    await prisma.project.deleteMany()
    await prisma.expenseCategory.deleteMany()
    await prisma.user.deleteMany()
  })

  it('[SUCESSO]: Fluxo completo de conclusão de despesa', async () => {
    // 1. Aluno cria despesa
    const createRes = await client.expenses.$post({
      json: {
        title: 'Viagem para Conclusão',
        event: {
          name: 'Evento Teste',
          location: 'Local Teste',
        },
        article: { classification: 'Sem Qualis' },
        surveyAnswers: [
          {
            expenseCategoryId: categoryId,
            data: { invoiceKey: 'formulario-preferencias/aluno-uuid/invoice.pdf' },
          },
        ],
      },
    }, { headers: alunoHeaders })
    expect(createRes.status).toBe(status.CREATED)
    assert(createRes.status === status.CREATED)
    const { id: expenseId } = await createRes.json()

    // 2. Coordenador aprova
    const approveRes = await client.expenses[':id'].status.$patch({
      param: { id: expenseId },
      json: { status: ExpenseRequestStatus.APROVADO },
    }, { headers: coordenadorHeaders })
    expect(approveRes.status).toBe(status.OK)
    assert(approveRes.status === status.OK)

    // 3. Admin vincula projeto (move para EM_PROCESSAMENTO)
    const assignRes = await client.expenses[':id']['assign-project'].$patch({
      param: { id: expenseId },
      json: { projectId },
    }, { headers: adminHeaders })
    expect(assignRes.status).toBe(status.OK)
    assert(assignRes.status === status.OK)

    // 4. Tenta concluir sem breakdowns -> Deve falhar (MISSING_BREAKDOWNS)
    const concludeFail1 = await client.expenses[':id'].conclude.$post({ param: { id: expenseId } }, { headers: adminHeaders })
    await expectProblem(concludeFail1, 'MISSING_BREAKDOWNS')

    // 5. Adiciona breakdown sem comprovante
    const breakdownRes = await client.expenses[':id']['cost-breakdowns'].$post({
      param: { id: expenseId },
      json: {
        amount: 100,
        subcategoryName,
      },
    }, { headers: adminHeaders })
    expect(breakdownRes.status).toBe(status.CREATED)
    assert(breakdownRes.status === status.CREATED)
    const { id: breakdownId } = await breakdownRes.json()

    // 6. Tenta concluir com breakdown sem comprovante -> Deve falhar (MISSING_RECEIPTS)
    const concludeFail2 = await client.expenses[':id'].conclude.$post({ param: { id: expenseId } }, { headers: adminHeaders })
    await expectProblem(concludeFail2, 'MISSING_RECEIPTS')

    // 7. Simula upload de comprovante via DB
    await prisma.costBreakdown.update({
      where: { id: breakdownId },
      data: { attachmentKey: 'fake-key' },
    })

    // [VALIDAÇÃO]: Testar falha de upload (MIME Type)
    const badFile = new File(['fake'], 'memo.txt', { type: 'text/plain' })
    const uploadBadMimeRes = await client.expenses[':id'].memorandum.$post({
      param: { id: expenseId },
      form: { file: badFile },
    }, { headers: alunoHeaders })

    const badMimeJson = await expectProblem(uploadBadMimeRes, 'UNSUPPORTED_MEDIA_TYPE')
    expect(badMimeJson).toHaveProperty('allowedMimeTypes')

    // [VALIDAÇÃO]: Testar falha de upload (Size)
    const hugeSize = (MEMORANDUM_UPLOAD_MAX_SIZE_MB + 1) * 1024 * 1024
    const hugeFile = new File([new ArrayBuffer(hugeSize)], 'huge.pdf', { type: 'application/pdf' })
    const uploadHugeRes = await client.expenses[':id'].memorandum.$post({
      param: { id: expenseId },
      form: { file: hugeFile },
    }, { headers: alunoHeaders })

    const hugeJson = await expectProblem(uploadHugeRes, 'FILE_TOO_LARGE')
    expect(hugeJson).toMatchObject({ maxSizeMB: MEMORANDUM_UPLOAD_MAX_SIZE_MB })

    // 8. Conclui com sucesso
    const concludeSuccess = await client.expenses[':id'].conclude.$post({ param: { id: expenseId } }, { headers: adminHeaders })
    expect(concludeSuccess.status).toBe(status.OK)
    assert(concludeSuccess.status === status.OK)

    const finalExpense = await concludeSuccess.json()
    expect(finalExpense.status).toBe(ExpenseRequestStatus.CONCLUIDO)
  })

  it('[PROIBIDO]: Apenas ADMIN pode concluir despesa', async () => {
    const createRes = await client.expenses.$post({
      json: {
        title: 'Viagem Proibida',
        event: {
          name: 'Evento Teste',
          location: 'Local Teste',
        },
        article: { classification: 'Sem Qualis' },
        surveyAnswers: [
          {
            expenseCategoryId: categoryId,
            data: { invoiceKey: 'formulario-preferencias/aluno-uuid/invoice.pdf' },
          },
        ],
      },
    }, { headers: alunoHeaders })
    expect(createRes.status).toBe(status.CREATED)
    assert(createRes.status === status.CREATED)
    const { id: expenseId } = await createRes.json()

    const approveRes = await client.expenses[':id'].status.$patch({
      param: { id: expenseId },
      json: { status: ExpenseRequestStatus.APROVADO },
    }, { headers: coordenadorHeaders })
    assert(approveRes.status === status.OK)

    const assignRes = await client.expenses[':id']['assign-project'].$patch({
      param: { id: expenseId },
      json: { projectId },
    }, { headers: adminHeaders })
    assert(assignRes.status === status.OK)

    // Tenta como Aluno
    const resAluno = await client.expenses[':id'].conclude.$post({ param: { id: expenseId } }, { headers: alunoHeaders })
    await expectProblem(resAluno, 'FORBIDDEN')

    // Tenta como Coordenador
    const resCoord = await client.expenses[':id'].conclude.$post({ param: { id: expenseId } }, { headers: coordenadorHeaders })
    await expectProblem(resCoord, 'FORBIDDEN')
  })

  it('[CONFLITO]: Não pode concluir se não estiver em EM_PROCESSAMENTO', async () => {
    const createRes = await client.expenses.$post({
      json: {
        title: 'Viagem Pendente',
        event: {
          name: 'Evento Teste',
          location: 'Local Teste',
        },
        article: { classification: 'Sem Qualis' },
        surveyAnswers: [
          {
            expenseCategoryId: categoryId,
            data: { invoiceKey: 'formulario-preferencias/aluno-uuid/invoice.pdf' },
          },
        ],
      },
    }, { headers: alunoHeaders })
    expect(createRes.status).toBe(status.CREATED)
    assert(createRes.status === status.CREATED)
    const { id: expenseId } = await createRes.json()

    const res = await client.expenses[':id'].conclude.$post({ param: { id: expenseId } }, { headers: adminHeaders })
    await expectProblem(res, 'INVALID_EXPENSE_STATE')
  })
})
