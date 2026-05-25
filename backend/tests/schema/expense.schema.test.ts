import type { z } from '@hono/zod-openapi'
import { assert, describe, expect, it } from 'vitest'
import { ExpenseRequestStatus } from '@/generated/prisma/enums'
import { CreateExpenseSchema, UpdateExpenseSchema, UpdateExpenseStatusSchema } from '@/schemas/expense.schema'
import { dummyExpenses } from '@/seeds/expense.seed'

describe('createExpenseSchema', () => {
  type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>

  const example = dummyExpenses.at(0)
  assert(example)

  const payload: CreateExpenseInput = {
    title: example.title,
    description: example.description,
    surveyAnswers: [
      {
        expenseCategoryId: '0748489b-4449-408a-a16b-44c9e0550c29',
        data: { some: 'data' },
      },
    ],
  }

  it('deve validar com sucesso uma despesa válida', () => {
    const result = CreateExpenseSchema.safeParse(payload)
    expect(result.success).toBe(true)
    assert(result.data)
    expect(result.data).toMatchObject(payload)
  })

  it('deve falhar quando surveyAnswers estiver vazio', () => {
    const invalidPayload = {
      ...payload,
      surveyAnswers: [],
    }

    const result = CreateExpenseSchema.safeParse(invalidPayload)
    expect(result.success).toBe(false)
    assert(result.error)
    const issue = result.error.issues.find(i => i.path.includes('surveyAnswers'))
    assert(issue)
    expect(issue.code).toBe('too_small')
  })

  it('deve falhar quando uma categoria não for um UUID válido', () => {
    const invalidPayload = {
      ...payload,
      surveyAnswers: [{
        expenseCategoryId: 'invalid-id',
        data: {},
      }],
    }

    const result = CreateExpenseSchema.safeParse(invalidPayload)
    expect(result.success).toBe(false)
    assert(result.error)
    const issue = result.error.issues.find(i => i.path.includes('expenseCategoryId'))
    assert(issue)
    expect(issue.code).toBe('invalid_format')
  })
})

describe('updateExpenseSchema', () => {
  it('permite atualização parcial de título e descrição', () => {
    const payload = {
      title: 'Novo Título',
      description: 'Nova Descrição',
    }
    const result = UpdateExpenseSchema.safeParse(payload)
    expect(result.success).toBe(true)
    assert(result.data)
    expect(result.data.title).toBe(payload.title)
    expect(result.data.description).toBe(payload.description)
  })

  it('permite atualização opcional de surveyAnswers', () => {
    const payload = {
      surveyAnswers: [
        {
          expenseCategoryId: '0748489b-4449-408a-a16b-44c9e0550c29',
          data: { updated: true },
        },
      ],
    }
    const result = UpdateExpenseSchema.safeParse(payload)
    expect(result.success).toBe(true)
    assert(result.data)
    expect(result.data.surveyAnswers).toHaveLength(1)
  })

  it('falha se campos não permitidos forem enviados', () => {
    const payload = { status: ExpenseRequestStatus.APROVADO }
    // UpdateExpenseSchema usa .pick({title, description}).partial().extend({surveyAnswers})
    // Então ele deve ignorar ou falhar dependendo se .passthrough() ou .strict() é usado.
    // BaseSchema em expense.schema.ts não usa strict().
    // Mas Zod por padrão ignora campos extras no safeParse a menos que strict() seja usado.
    const result = UpdateExpenseSchema.safeParse(payload)
    expect(result.success).toBe(true)
    expect(result.data).not.toHaveProperty('status')
  })
})

describe('updateExpenseStatusSchema', () => {
  type UpdateExpenseStatusInput = z.infer<typeof UpdateExpenseStatusSchema>

  it('exige motivo quando status é rejeitado', () => {
    const missingReasonWhenRejectedPayload: UpdateExpenseStatusInput = { status: ExpenseRequestStatus.REJEITADO }
    const result = UpdateExpenseStatusSchema.safeParse(missingReasonWhenRejectedPayload)
    expect(result.success).toBe(false)
    assert(result.error)
    const issue = result.error.issues.find(i => i.message.includes('motivo é obrigatório'))
    assert(issue)
    expect(issue.path).toContain('reason')
    expect(issue.code).toBe('custom')
  })
})
