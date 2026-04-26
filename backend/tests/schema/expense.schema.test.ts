import type { z } from '@hono/zod-openapi'
import { assert, describe, expect, it } from 'vitest'
import { CreateExpenseSchema } from '@/schemas/expense.schema'
import { dummyExpenses } from '@/seeds/expense.seed'

describe('createExpenseSchema', () => {
  type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>

  const example = dummyExpenses.at(0)
  assert(example)

  const payload: CreateExpenseInput = {
    title: example.title,
    description: example.description,
    city: example.city,
    country: example.country,
    state: example.state,
    departureDate: new Date(example.departureDate),
    returnDate: new Date(example.returnDate),
  }

  it('deve validar com sucesso uma despesa válida', () => {
    const result = CreateExpenseSchema.safeParse(payload)
    expect(result.success).toBe(true)
    assert(result.data)
    expect(result.data).toMatchObject(payload)
  })

  it('deve falhar quando a cidade não for informada', () => {
    const { city, ...missingCityPayload } = payload

    const result = CreateExpenseSchema.safeParse(missingCityPayload)
    expect(result.success).toBe(false)
    assert(result.error)
    expect(result.error.issues).length(1)
    const issue = result.error.issues.find(i => i.path.includes('city'))
    assert(issue)
    expect(issue.path).toContain('city')
    expect(issue.code).toBe('invalid_type')
  })

  describe('validações de província', () => {
    it('deve falhar quando a província não segue o padrão ISO-3166-2', () => {
      const testPayload: CreateExpenseInput = {
        ...payload,
        state: 'Alasca',
      }

      const result = CreateExpenseSchema.safeParse(testPayload)
      expect(result.success).toBe(false)
      assert(result.error)
      const issue = result.error.issues.find(i => i.path.includes('state'))
      assert(issue)
      expect(issue.code).toBe('custom')
    })

    it('deve falhar quando a província não pertence ao país selecionado', () => {
      const testPayload: CreateExpenseInput = {
        ...payload,
        country: 'BR',
        state: 'US-NY',
      }

      const result = CreateExpenseSchema.safeParse(testPayload)
      expect(result.success).toBe(false)
      assert(result.error)
      const issue = result.error.issues.find(i => i.message.includes('não pertence'))
      assert(issue)
      expect(issue.code).toBe('custom')
    })
  })

  it('deve falhar quando a data de retorno for anterior à data de partida', () => {
    const testPayload: CreateExpenseInput = {
      ...payload,
      departureDate: new Date('2026-05-25T10:00:00Z'),
      returnDate: new Date('2026-05-20T10:00:00Z'),
    }

    const result = CreateExpenseSchema.safeParse(testPayload)

    expect(result.success).toBe(false)
    assert(result.error)
    expect(result.error.issues).length(1)
    const issue = result.error.issues.find(i => i.path.includes('returnDate'))
    assert(issue)
    expect(issue.path).toContain('returnDate')
    expect(issue.code).toBe('custom')
  })
})
