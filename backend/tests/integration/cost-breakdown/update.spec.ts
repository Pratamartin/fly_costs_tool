import { testClient } from 'hono/testing'
import * as status from 'stoker/http-status-codes'
import { afterAll, assert, beforeAll, describe, expect, it } from 'vitest'
import { ID_ALUNO } from '@/constants/seed.constant'
import { ALLOWED_STATUSES_FOR_COST_ALLOCATION } from '@/constants/expense.constant'
import { ExpenseRequestStatus } from '@/generated/prisma/enums'
import { createTestApp } from '@/lib/config'
import prisma from '@/lib/orm'
import { expenses } from '@/routes'
import { seedExpenseCategories, seedPreferenceSurveys, seedUsers } from '@/seeds'
import { dummyExpenseCategories } from '@/seeds/expense.category.seed'
import { getAuthHeaders } from '../../util'
import { expectProblem } from '../../util/assertions'

const client = testClient(createTestApp(expenses))

describe('[Cost Breakdown] - Update (PATCH /expenses/:id/cost-breakdowns/:breakdownId)', () => {
  let adminHeaders: { Authorization: string }
  let studentHeaders: { Authorization: string }

  let expenseId: string
  let otherExpenseId: string
  let breakdownId: string

  // Projects
  let baseProjectId: string
  let secondaryProjectId: string
  let exactLimitProjectId: string
  let poorProjectId: string
  let strictProjectId: string
  let futureProjectId: string
  let archivedProjectId: string

  const category = dummyExpenseCategories[0]!
  const strictCategory = dummyExpenseCategories[1]!

  beforeAll(async () => {
    await seedUsers()
    await seedExpenseCategories()
    await seedPreferenceSurveys()

    adminHeaders = await getAuthHeaders('admin@test.com', 'ADMIN')
    studentHeaders = await getAuthHeaders('aluno@test.com', 'ALUNO')

    // 1. Create Base Project (Limit 1000)
    const baseProject = await prisma.project.create({
      data: {
        name: 'Base Project',
        code: 'UPD-BASE',
        budget: 1000,
        usedBudget: 0,
        startDate: new Date('2020-01-01T00:00:00Z'),
        endDate: new Date('2030-12-31T00:00:00Z'),
        expenseCategories: { connect: { id: category.id! } },
      },
    })
    baseProjectId = baseProject.id

    // 2. Secondary Project (Limit 3000)
    const secondaryProject = await prisma.project.create({
      data: {
        name: 'Secondary Project',
        code: 'UPD-SEC',
        budget: 3000,
        usedBudget: 0,
        startDate: new Date('2020-01-01T00:00:00Z'),
        endDate: new Date('2030-12-31T00:00:00Z'),
        expenseCategories: { connect: { id: category.id! } },
      },
    })
    secondaryProjectId = secondaryProject.id

    // 3. Exact Limit Project (Limit 5000)
    const exactLimitProject = await prisma.project.create({
      data: {
        name: 'Exact Limit Project',
        code: 'UPD-EXACT',
        budget: 5000,
        usedBudget: 0,
        startDate: new Date('2020-01-01T00:00:00Z'),
        endDate: new Date('2030-12-31T00:00:00Z'),
        expenseCategories: { connect: { id: category.id! } },
      },
    })
    exactLimitProjectId = exactLimitProject.id

    // 4. Poor Project (Limit 300)
    const poorProject = await prisma.project.create({
      data: {
        name: 'Poor Project',
        code: 'UPD-POOR',
        budget: 300,
        usedBudget: 0,
        startDate: new Date('2020-01-01T00:00:00Z'),
        endDate: new Date('2030-12-31T00:00:00Z'),
        expenseCategories: { connect: { id: category.id! } },
      },
    })
    poorProjectId = poorProject.id

    // 5. Strict Project (Only accepts strictCategory)
    const strictProject = await prisma.project.create({
      data: {
        name: 'Strict Project',
        code: 'UPD-STRICT',
        budget: 1000,
        usedBudget: 0,
        startDate: new Date('2020-01-01T00:00:00Z'),
        endDate: new Date('2030-12-31T00:00:00Z'),
        expenseCategories: { connect: { id: strictCategory.id! } },
      },
    })
    strictProjectId = strictProject.id

    // 6. Future Project (Starts 2028)
    const futureProject = await prisma.project.create({
      data: {
        name: 'Future Project',
        code: 'UPD-FUTURE',
        budget: 1000,
        usedBudget: 0,
        startDate: new Date('2028-01-01T00:00:00Z'),
        endDate: new Date('2030-12-31T00:00:00Z'),
        expenseCategories: { connect: { id: category.id! } },
      },
    })
    futureProjectId = futureProject.id

    // 7. Archived Project
    const archivedProject = await prisma.project.create({
      data: {
        name: 'Archived Project',
        code: 'UPD-ARCHIVED',
        budget: 1000,
        usedBudget: 0,
        isActive: false,
        startDate: new Date('2020-01-01T00:00:00Z'),
        endDate: new Date('2030-12-31T00:00:00Z'),
        expenseCategories: { connect: { id: category.id! } },
      },
    })
    archivedProjectId = archivedProject.id

    // Expense A (Created in 2026)
    const expense = await prisma.expenseRequest.create({
      data: {
        title: 'Despesa para Update de Custos',
        status: ExpenseRequestStatus.EM_PROCESSAMENTO,
        event: {
          name: 'Evento',
          location: 'Local',
        },
        article: { classification: 'Sem Qualis' },
        studentId: ID_ALUNO,
        createdAt: new Date('2026-06-01T00:00:00Z'),
      },
    })
    expenseId = expense.id

    // Expense B (For IDOR tests)
    const otherExpense = await prisma.expenseRequest.create({
      data: {
        title: 'Outra Despesa',
        status: ExpenseRequestStatus.EM_PROCESSAMENTO,
        event: {
          name: 'Evento',
          location: 'Local',
        },
        article: { classification: 'Sem Qualis' },
        studentId: ID_ALUNO,
        createdAt: new Date('2026-06-01T00:00:00Z'),
      },
    })
    otherExpenseId = otherExpense.id

    // Create Initial Breakdown (500 in Base Project)
    const breakdown = await prisma.costBreakdown.create({
      data: {
        amount: 500,
        projectId: baseProjectId,
        expenseCategoryId: category.id!,
        expenseRequestId: expenseId,
      },
    })
    breakdownId = breakdown.id
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

  describe('a. Segurança & Permissões', () => {
    it('[FALHA - 401] Deve rejeitar requisição sem token', async () => {
      const res = await client.expenses[':id']['cost-breakdowns'][':breakdownId'].$patch({
        param: {
          id: expenseId,
          breakdownId,
        },
        json: { amount: 800 },
      })
      expect(res.status).toBe(status.UNAUTHORIZED)
    })

    it('[FALHA - 403] Deve rejeitar requisição de perfil ALUNO', async () => {
      const res = await client.expenses[':id']['cost-breakdowns'][':breakdownId'].$patch({
        param: {
          id: expenseId,
          breakdownId,
        },
        json: { amount: 800 },
      }, { headers: studentHeaders })
      expect(res.status).toBe(status.FORBIDDEN)
    })
  })

  describe('b. Integridade de Rota & Validação (IDOR & Schema)', () => {
    it('[FALHA - 404] Deve retornar erro se o breakdownId não existir', async () => {
      const res = await client.expenses[':id']['cost-breakdowns'][':breakdownId'].$patch({
        param: {
          id: expenseId,
          breakdownId: '00000000-0000-0000-0000-000000000000',
        },
        json: { amount: 800 },
      }, { headers: adminHeaders })
      await expectProblem(res, 'COST_BREAKDOWN_NOT_FOUND')
    })

    it('[FALHA - 404] Deve prevenir IDOR cruzando expenseId errado', async () => {
      const res = await client.expenses[':id']['cost-breakdowns'][':breakdownId'].$patch({
        param: {
          id: otherExpenseId,
          breakdownId,
        },
        json: { amount: 800 },
      }, { headers: adminHeaders })
      await expectProblem(res, 'COST_BREAKDOWN_NOT_FOUND')
    })

    it('[FALHA - 422] Deve rejeitar valor negativo via Schema', async () => {
      const res = await client.expenses[':id']['cost-breakdowns'][':breakdownId'].$patch({
        param: {
          id: expenseId,
          breakdownId,
        },
        json: { amount: -50 },
      }, { headers: adminHeaders })
      const json = await expectProblem(res, 'VALIDATION_ERROR')
      expect(json.errors[0]?.code).toBe('too_small')
    })
  })

  describe('c. Limites e Máquinas de Estado Financeiras', () => {
    it('[SUCESSO] Deve aumentar o valor se houver teto', async () => {
      const res = await client.expenses[':id']['cost-breakdowns'][':breakdownId'].$patch({
        param: {
          id: expenseId,
          breakdownId,
        },
        json: { amount: 800 },
      }, { headers: adminHeaders })
      expect(res.status).toBe(status.OK)
      assert(res.status === status.OK)
      const json = (await res.json()) as any
      expect(json.amount).toBe(800)
    })

    it('[SUCESSO] Deve reduzir o valor e liberar limite', async () => {
      const res = await client.expenses[':id']['cost-breakdowns'][':breakdownId'].$patch({
        param: {
          id: expenseId,
          breakdownId,
        },
        json: { amount: 200 },
      }, { headers: adminHeaders })
      expect(res.status).toBe(status.OK)
      assert(res.status === status.OK)
      const json = (await res.json()) as any
      expect(json.amount).toBe(200)
    })

    it('[FALHA - 409] Deve rejeitar se estourar o limite do projeto atual', async () => {
      const res = await client.expenses[':id']['cost-breakdowns'][':breakdownId'].$patch({
        param: {
          id: expenseId,
          breakdownId,
        },
        json: { amount: 1200 }, // Teto é 1000
      }, { headers: adminHeaders })
      await expectProblem(res, 'PROJECT_INSUFFICIENT_FUNDS', { availableBudget: '1000.00' })
    })

    it('[FALHA - 400] Deve bloquear edição se despesa estiver APROVADA', async () => {
      // 1. Muda status temporariamente para APROVADO
      await prisma.expenseRequest.update({
        where: { id: expenseId },
        data: { status: 'APROVADO' },
      })

      const res = await client.expenses[':id']['cost-breakdowns'][':breakdownId'].$patch({
        param: {
          id: expenseId,
          breakdownId,
        },
        json: { amount: 600 },
      }, { headers: adminHeaders })
      await expectProblem(res, 'INVALID_EXPENSE_STATE', {
        resourceState: {
          current: 'APROVADO',
          required: ALLOWED_STATUSES_FOR_COST_ALLOCATION
        }
      })

      // 2. Volta para EM_PROCESSAMENTO para os testes seguintes
      await prisma.expenseRequest.update({
        where: { id: expenseId },
        data: { status: 'EM_PROCESSAMENTO' },
      })
    })
  })

  describe('d. Transferência de Projetos (Cross-Project Updates)', () => {
    it('[SUCESSO] Deve transferir rateio para projeto válido', async () => {
      const res = await client.expenses[':id']['cost-breakdowns'][':breakdownId'].$patch({
        param: {
          id: expenseId,
          breakdownId,
        },
        json: {
          projectId: secondaryProjectId,
          amount: 2000,
        },
      }, { headers: adminHeaders })
      expect(res.status).toBe(status.OK)
      assert(res.status === status.OK)
      const json = (await res.json()) as any
      expect(json.projectId).toBe(secondaryProjectId)
      expect(json.amount).toBe(2000)
    })

    it('[SUCESSO] Deve transferir consumindo 100% do limite novo', async () => {
      const res = await client.expenses[':id']['cost-breakdowns'][':breakdownId'].$patch({
        param: {
          id: expenseId,
          breakdownId,
        },
        json: {
          projectId: exactLimitProjectId,
          amount: 5000,
        },
      }, { headers: adminHeaders })
      expect(res.status).toBe(status.OK)
      assert(res.status === status.OK)
      const json = (await res.json()) as any
      expect(json.projectId).toBe(exactLimitProjectId)
      expect(json.amount).toBe(5000)
    })

    it('[FALHA - 409] Deve rejeitar se novo projeto não tiver saldo', async () => {
      const res = await client.expenses[':id']['cost-breakdowns'][':breakdownId'].$patch({
        param: {
          id: expenseId,
          breakdownId,
        },
        json: {
          projectId: poorProjectId,
          amount: 500,
        }, // poor tem 300
      }, { headers: adminHeaders })
      await expectProblem(res, 'PROJECT_INSUFFICIENT_FUNDS', { availableBudget: '300.00' })
    })

    it('[FALHA - 400] Deve rejeitar se novo projeto não cobre categoria atual', async () => {
      const res = await client.expenses[':id']['cost-breakdowns'][':breakdownId'].$patch({
        param: {
          id: expenseId,
          breakdownId,
        },
        json: { projectId: strictProjectId },
      }, { headers: adminHeaders })
      await expectProblem(res, 'INVALID_SUBCATEGORIES', {
        invalidNames: [category.normalizedName],
        allowedNames: [strictCategory.normalizedName]
      })
    })

    it('[FALHA - 409] Deve rejeitar se a despesa ocorreu antes da vigência do novo projeto', async () => {
      const res = await client.expenses[':id']['cost-breakdowns'][':breakdownId'].$patch({
        param: {
          id: expenseId,
          breakdownId,
        },
        json: { projectId: futureProjectId },
      }, { headers: adminHeaders })
      await expectProblem(res, 'PROJECT_PERIOD_EXPIRED', {
        projectStartDate: new Date('2028-01-01T00:00:00Z').toISOString(),
        projectEndDate: new Date('2030-12-31T00:00:00Z').toISOString()
      })
    })

    it('[FALHA - 410] Deve rejeitar atualização se o projeto alvo estiver ARQUIVADO', async () => {
      const res = await client.expenses[':id']['cost-breakdowns'][':breakdownId'].$patch({
        param: {
          id: expenseId,
          breakdownId,
        },
        json: { projectId: archivedProjectId },
      }, { headers: adminHeaders })
      await expectProblem(res, 'PROJECT_ARCHIVED')
    })

    it('[SUCESSO] Deve conseguir transferir projeto e alterar categoria simultaneamente', async () => {
      const res = await client.expenses[':id']['cost-breakdowns'][':breakdownId'].$patch({
        param: {
          id: expenseId,
          breakdownId,
        },
        json: { 
          projectId: strictProjectId,
          subcategoryName: strictCategory.normalizedName,
          amount: 50
        },
      }, { headers: adminHeaders })
      expect(res.status).toBe(status.OK)
      const json = (await res.json()) as any
      expect(json.projectId).toBe(strictProjectId)
      expect(json.amount).toBe(50)
      expect(json.subcategory.normalizedName).toBe(strictCategory.normalizedName)
    })

    it('[SUCESSO] Deve conseguir atualizar o attachmentKey', async () => {
      const res = await client.expenses[':id']['cost-breakdowns'][':breakdownId'].$patch({
        param: {
          id: expenseId,
          breakdownId,
        },
        json: { attachmentKey: 'novo/caminho/comprovante.pdf' },
      }, { headers: adminHeaders })
      expect(res.status).toBe(status.OK)
      const json = (await res.json()) as any
      expect(json.attachmentKey).toBe('novo/caminho/comprovante.pdf')
    })
  })
})
