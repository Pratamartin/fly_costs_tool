import { describe, expect, it, vi } from 'vitest'
import { createExpenseRequest, getAllExpenseRequests, getExpenseById, updateExpenseStatus } from '../../backend/src/services/expense.service'
import { ExpenseRequestStatus, UserRole } from '../../backend/src/generated/prisma/enums'
import prisma from '../../backend/src/lib/orm'

vi.mock('../../backend/src/lib/orm', () => ({
  default: {
    expenseRequest: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

describe('createExpenseRequest', () => {
  it('cria solicitação de despesa', async () => {
    const mockExpense = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      studentId: '123e4567-e89b-12d3-a456-426614174001',
      title: 'Test Expense',
      description: 'Test',
      amount: 100,
      status: ExpenseRequestStatus.PENDENTE,
      topic: 'INSCRICAO',
      projectId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    vi.mocked(prisma.expenseRequest.create).mockResolvedValue(mockExpense)

    const result = await createExpenseRequest('123e4567-e89b-12d3-a456-426614174001', {
      title: 'Test Expense',
      description: 'Test',
      amount: 100,
      topic: 'INSCRICAO',
    })

    expect(result).toBeDefined()
    expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000')
    expect(result.status).toBe(ExpenseRequestStatus.PENDENTE)
    expect(prisma.expenseRequest.create).toHaveBeenCalled()
  })
})

describe('getAllExpenseRequests', () => {
  it('retorna todas despesas para ADMIN', async () => {
    const mockExpenses = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        studentId: '123e4567-e89b-12d3-a456-426614174001',
        title: 'Expense 1',
        description: null,
        amount: { toString: () => '100' },
        status: ExpenseRequestStatus.PENDENTE,
        topic: 'INSCRICAO',
        projectId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        project: null,
        student: { id: '123e4567-e89b-12d3-a456-426614174001', name: 'User 1' },
      },
    ]

    vi.mocked(prisma.expenseRequest.findMany).mockResolvedValue(mockExpenses)

    const result = await getAllExpenseRequests('123e4567-e89b-12d3-a456-426614174002', UserRole.ADMIN, {})

    expect(result).toHaveLength(1)
    expect(result[0].amount).toBe('100')
  })

  it('retorna apenas despesas do aluno para ALUNO', async () => {
    const mockExpenses = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        studentId: '123e4567-e89b-12d3-a456-426614174001',
        title: 'Expense 1',
        description: null,
        amount: { toString: () => '100' },
        status: ExpenseRequestStatus.PENDENTE,
        topic: 'INSCRICAO',
        projectId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        project: null,
      },
    ]

    vi.mocked(prisma.expenseRequest.findMany).mockResolvedValue(mockExpenses)

    const result = await getAllExpenseRequests('123e4567-e89b-12d3-a456-426614174001', UserRole.ALUNO, {})

    expect(result).toHaveLength(1)
    expect(result[0].studentId).toBe('123e4567-e89b-12d3-a456-426614174001')
  })
})

describe('getExpenseById', () => {
  it('retorna despesa quando existe', async () => {
    const mockExpense = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      studentId: '123e4567-e89b-12d3-a456-426614174001',
      title: 'Expense 1',
      description: null,
      amount: { toString: () => '100' },
      status: ExpenseRequestStatus.PENDENTE,
      topic: 'INSCRICAO',
      projectId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      project: null,
    }

    vi.mocked(prisma.expenseRequest.findFirst).mockResolvedValue(mockExpense)

    const result = await getExpenseById('123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001', UserRole.ALUNO)

    expect(result).toBeDefined()
    expect(result?.id).toBe('123e4567-e89b-12d3-a456-426614174000')
  })

  it('retorna null quando não existe', async () => {
    vi.mocked(prisma.expenseRequest.findFirst).mockResolvedValue(null)

    const result = await getExpenseById('123e4567-e89b-12d3-a456-999999999999', '123e4567-e89b-12d3-a456-426614174001', UserRole.ALUNO)

    expect(result).toBeNull()
  })
})

describe('updateExpenseStatus', () => {
  it('atualiza status quando despesa existe e está pendente', async () => {
    const existingExpense = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      status: ExpenseRequestStatus.PENDENTE,
      studentId: '123e4567-e89b-12d3-a456-426614174001',
      title: 'Test',
      description: null,
      amount: 100,
      topic: 'INSCRICAO',
      projectId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const updatedExpense = {
      ...existingExpense,
      status: ExpenseRequestStatus.APROVADO,
    }

    vi.mocked(prisma.expenseRequest.findUnique).mockResolvedValue(existingExpense)
    vi.mocked(prisma.expenseRequest.update).mockResolvedValue(updatedExpense)

    const result = await updateExpenseStatus('123e4567-e89b-12d3-a456-426614174000', ExpenseRequestStatus.APROVADO)

    expect(result.data).toBeDefined()
    expect(result.data?.status).toBe(ExpenseRequestStatus.APROVADO)
  })

  it('retorna erro NOT_FOUND quando despesa não existe', async () => {
    vi.mocked(prisma.expenseRequest.findUnique).mockResolvedValue(null)

    const result = await updateExpenseStatus('123e4567-e89b-12d3-a456-999999999999', ExpenseRequestStatus.APROVADO)

    expect(result.error).toBe('Not Found')
  })

  it('retorna erro CONFLICT quando despesa já foi decidida', async () => {
    const existingExpense = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      status: ExpenseRequestStatus.APROVADO,
      studentId: '123e4567-e89b-12d3-a456-426614174001',
      title: 'Test',
      description: null,
      amount: 100,
      topic: 'INSCRICAO',
      projectId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    vi.mocked(prisma.expenseRequest.findUnique).mockResolvedValue(existingExpense)

    const result = await updateExpenseStatus('123e4567-e89b-12d3-a456-426614174000', ExpenseRequestStatus.REJEITADO)

    expect(result.error).toBe('Conflict')
  })
})
