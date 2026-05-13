import { testClient } from 'hono/testing'
import * as status from 'stoker/http-status-codes'
import { afterAll, assert, beforeAll, describe, expect, it } from 'vitest'
import { ID_ALUNO, ID_PROJ_IA } from '@/constants/seed.constant'
import { ExpenseRequestStatus } from '@/generated/prisma/enums'
import { createTestApp } from '@/lib/config'
import prisma from '@/lib/orm'
import { expenses } from '@/routes'
import { seedExpenseCategories, seedUsers } from '@/seeds'
import { dummyExpenseCategories } from '@/seeds/expense.category.seed'
import seedProjects from '@/seeds/project.seed'
import { getAuthHeaders } from '../../util'

const client = testClient(createTestApp(expenses))

describe('[Expense] Criar cost breakdown em projeto arquivado', () => {
  let adminHeaders: { Authorization: string }
  let expenseId: string

  beforeAll(async () => {
    await seedUsers()
    await seedExpenseCategories()
    await seedProjects()

    adminHeaders = await getAuthHeaders('admin@test.com', 'ADMIN')

    const expense = await prisma.expenseRequest.create({
      data: {
        title: 'Despesa para projeto arquivado',
        status: ExpenseRequestStatus.EM_PROCESSAMENTO,
        projectId: ID_PROJ_IA,
        studentId: ID_ALUNO,
        city: 'São Paulo',
        state: 'BR-SP',
        country: 'BR',
        departureDate: new Date('2026-06-01'),
        returnDate: new Date('2026-06-03'),
      },
    })

    expenseId = expense.id

    await prisma.project.update({
      where: { id: ID_PROJ_IA },
      data: { isActive: false },
    })
  })

  afterAll(async () => {
    await prisma.expenseRequest.deleteMany()
    await prisma.project.deleteMany()
    await prisma.user.deleteMany()
  })

  it('não permite criar cost breakdown para projeto arquivado', async () => {
    const endpoint = client.expenses[':id']['cost-breakdowns'].$post
    const res = await endpoint(
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

    assert(res.status === status.CONFLICT)
    const json = await res.json()
    expect(json).toHaveProperty('message')
    expect(json.message).toContain('arquivado')
  })
})
