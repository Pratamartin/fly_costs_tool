import { testClient } from 'hono/testing'
import * as status from 'stoker/http-status-codes'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ID_ALUNO, ID_PROJ_IA } from '@/constants/seed.constant'
import { ExpenseRequestStatus } from '@/generated/prisma/enums'
import { createTestApp } from '@/lib/config'
import prisma from '@/lib/orm'
import { expenses } from '@/routes'
import { seedExpenseCategories, seedPreferenceSurveys, seedUsers } from '@/seeds'
import { dummyExpenseCategories } from '@/seeds/expense.category.seed'
import seedProjects from '@/seeds/project.seed'
import { createCostBreakdown } from '@/services/budget.service'
import { getAuthHeaders } from '../../util'
import { expectProblem } from '../../util/assertions'

const client = testClient(createTestApp(expenses))

describe('dELETE /expenses/:id (Exclusão Financeira)', () => {
  let adminHeaders: { Authorization: string }
  const subcategoryName = dummyExpenseCategories[0]!.normalizedName

  beforeAll(async () => {
    await seedUsers()
    await seedExpenseCategories()
    await seedPreferenceSurveys()
    await seedProjects()
    adminHeaders = await getAuthHeaders('admin@test.com', 'ADMIN')
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

  it('deve permitir deletar despesa em processamento sem afetar saldo (Nova Regra)', async () => {
    // 1. Setup: Projeto com saldo inicial
    const initialProject = await prisma.project.findUniqueOrThrow({ where: { id: ID_PROJ_IA } })
    const saldoInicial = Number(initialProject.usedBudget)

    // 2. Criar despesa e adicionar discriminação (não deve afetar saldo ainda)
    const expense = await prisma.expenseRequest.create({
      data: {
        title: 'Despesa para Deletar',
        status: ExpenseRequestStatus.EM_PROCESSAMENTO,
        event: {
          name: 'E',
          location: 'L',
        },
        article: { classification: 'Sem Qualis' },
        studentId: ID_ALUNO,
      },
    })

    await createCostBreakdown(expense.id, {
      amount: 500,
      projectId: ID_PROJ_IA,
      subcategoryName,
    })

    // Saldo deve continuar igual ao inicial (Opção A)
    const projectMid = await prisma.project.findUniqueOrThrow({ where: { id: ID_PROJ_IA } })
    expect(Number(projectMid.usedBudget)).toBe(saldoInicial)

    // 3. Deletar despesa
    const res = await client.expenses[':id'].$delete(
      { param: { id: expense.id } },
      { headers: adminHeaders },
    )
    expect(res.status).toBe(status.OK)

    // 4. Saldo deve permanecer intacto
    const finalProject = await prisma.project.findUniqueOrThrow({ where: { id: ID_PROJ_IA } })
    expect(Number(finalProject.usedBudget)).toBe(saldoInicial)
  })

  it('deve bloquear a deleção de uma despesa com status CONCLUIDO', async () => {
    // 1. Criar despesa concluída
    const expense = await prisma.expenseRequest.create({
      data: {
        title: 'Despesa Concluída Imutável',
        status: ExpenseRequestStatus.CONCLUIDO,
        event: {
          name: 'E',
          location: 'L',
        },
        article: { classification: 'Sem Qualis' },
        studentId: ID_ALUNO,
      },
    })

    // 2. Tentar deletar
    const res = await client.expenses[':id'].$delete(
      { param: { id: expense.id } },
      { headers: adminHeaders },
    )

    // 3. Deve retornar erro de estado inválido (Task 1.3)
    await expectProblem(res, 'INVALID_EXPENSE_STATE')
  })
})
