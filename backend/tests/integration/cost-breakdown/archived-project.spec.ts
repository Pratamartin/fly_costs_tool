import { testClient } from 'hono/testing'
import { afterAll, beforeAll, describe, it } from 'vitest'
import { ID_ALUNO, ID_PROJ_IA } from '@/constants/seed.constant'
import { ExpenseRequestStatus } from '@/generated/prisma/enums'
import { createTestApp } from '@/lib/config'
import prisma from '@/lib/orm'
import { expenses } from '@/routes'
import { seedExpenseCategories, seedPreferenceSurveys, seedUsers } from '@/seeds'
import { dummyExpenseCategories } from '@/seeds/expense.category.seed'
import seedProjects from '@/seeds/project.seed'
import { getAuthHeaders } from '../../util'
import { expectProblem } from '../../util/assertions'

const client = testClient(createTestApp(expenses))

describe('[Expense] Criar cost breakdown em projeto arquivado', () => {
  let adminHeaders: { Authorization: string }
  let expenseId: string

  beforeAll(async () => {
    await seedUsers()
    await seedExpenseCategories()
    await seedPreferenceSurveys()
    await seedProjects()

    adminHeaders = await getAuthHeaders('admin@test.com', 'ADMIN')

    const expense = await prisma.expenseRequest.create({
      data: {
        title: 'Despesa para projeto arquivado',
        status: ExpenseRequestStatus.EM_PROCESSAMENTO,
        event: {
          name: 'Evento Teste',
          location: 'Local Teste',
        },
        article: { classification: 'Sem Qualis' },
        projectId: ID_PROJ_IA,
        studentId: ID_ALUNO,
      },
    })

    expenseId = expense.id

    await prisma.project.update({
      where: { id: ID_PROJ_IA },
      data: { isActive: false },
    })
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

  it('não permite criar cost breakdown para projeto arquivado', async () => {
    const res = await client.expenses[':id']['cost-breakdowns'].$post(
      {
        param: { id: expenseId },
        json: {
          amount: 100,
          subcategoryName: dummyExpenseCategories[0]!.normalizedName,
          attachmentKey: 'key/abc.pdf',
        },

      },
      { headers: adminHeaders },
    )

    await expectProblem(res, 'PROJECT_ARCHIVED')
  })
})
