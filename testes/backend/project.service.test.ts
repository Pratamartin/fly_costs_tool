import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_SUBCATEGORIES, MIN_SUBCATEGORIES, PROJECT_ERROR_CODES } from '@/constants/project.constant'
import { createProject, deleteProject, getProjectById, updateProject } from '@/services/project.service'
import { Prisma } from '@/generated/prisma/client'

const prismaMock = vi.hoisted(() => ({
  project: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('@/lib/orm', () => ({ default: prismaMock }))

vi.mock('@/services/expense.category.service', () => ({
  validateSubcategoriesExist: vi.fn(),
}))

import { validateSubcategoriesExist } from '@/services/expense.category.service'

const PID = '323e4567-e89b-12d3-a456-426614174002'

function projectRow(overrides: Record<string, unknown> = {}) {
  return {
    id: PID,
    name: 'Projeto Teste',
    code: 'PRJ-01',
    budget: new Prisma.Decimal(50_000),
    usedBudget: new Prisma.Decimal(5000),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    expenseCategories: [{ normalizedName: 'inscricao' }],
    ...overrides,
  }
}

describe('project.service CRUD', () => {
  beforeEach(() => {
    vi.mocked(validateSubcategoriesExist).mockResolvedValue(true)
  })

  it('criação com subcategorias conecta categorias existentes', async () => {
    prismaMock.project.findUnique.mockResolvedValue(null)
    prismaMock.project.create.mockResolvedValue(
      projectRow({
        usedBudget: new Prisma.Decimal(0),
        expenseCategories: [{ normalizedName: 'passagem' }, { normalizedName: 'hospedagem' }],
      }),
    )

    const result = await createProject({
      name: 'Lab',
      code: 'LAB-1',
      budget: 50_000,
      subcategories: ['passagem', 'hospedagem'],
    })

    expect('error' in result).toBe(false)
    if ('error' in result)
      return
    expect(result.subcategories).toEqual(expect.arrayContaining(['passagem', 'hospedagem']))
    expect(Number(result.usedBudget)).toBe(0)
  })

  it('edição atualiza nome e code quando válido', async () => {
    prismaMock.project.findUnique
      .mockResolvedValueOnce(projectRow({ code: 'OLD' }))
      .mockResolvedValueOnce(null)
    prismaMock.project.update.mockResolvedValue(projectRow({ name: 'Novo', code: 'NEW' }))

    const result = await updateProject(PID, { name: 'Novo', code: 'NEW' })

    expect('error' in result).toBe(false)
    if ('error' in result)
      return
    expect(result.name).toBe('Novo')
    expect(result.code).toBe('NEW')
  })

  it('arquivamento (soft delete) define isActive false', async () => {
    prismaMock.project.findUnique.mockResolvedValue(projectRow({ isActive: true }))
    prismaMock.project.update.mockResolvedValue(projectRow({ isActive: false }))

    const result = await deleteProject(PID)

    expect('error' in result).toBe(false)
    if ('error' in result)
      return
    expect(result.isActive).toBe(false)
    expect(prismaMock.project.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { isActive: false },
      }),
    )
  })

  it('validação: menos que MIN_SUBCATEGORIES retorna INVALID_SUBCATEGORIES_COUNT', async () => {
    prismaMock.project.findUnique.mockResolvedValue(null)

    const result = await createProject({
      name: 'X',
      code: 'X1',
      budget: 100,
      subcategories: [],
    })

    expect('error' in result && result.error).toBe(PROJECT_ERROR_CODES.INVALID_SUBCATEGORIES_COUNT)
  })

  it('validação: mais que MAX_SUBCATEGORIES retorna erro', async () => {
    prismaMock.project.findUnique.mockResolvedValue(null)
    const many = Array.from({ length: MAX_SUBCATEGORIES + 1 }, (_, i) => `cat${i}`)

    const result = await createProject({
      name: 'X',
      code: 'X2',
      budget: 100,
      subcategories: many,
    })

    expect('error' in result && result.error).toBe(PROJECT_ERROR_CODES.INVALID_SUBCATEGORIES_COUNT)
    expect(many.length).toBeGreaterThan(MAX_SUBCATEGORIES)
    expect(MIN_SUBCATEGORIES).toBeGreaterThanOrEqual(1)
  })

  it('subcategorias inexistentes retorna SUBCATEGORIES_NOT_FOUND', async () => {
    prismaMock.project.findUnique.mockResolvedValue(null)
    vi.mocked(validateSubcategoriesExist).mockResolvedValueOnce(false)

    const result = await createProject({
      name: 'Y',
      code: 'Y8',
      budget: 1000,
      subcategories: ['fantasma'],
    })

    expect('error' in result && result.error).toBe(PROJECT_ERROR_CODES.SUBCATEGORIES_NOT_FOUND)
  })

  it('usedBudget na resposta reflete valor comprometido persistido', async () => {
    prismaMock.project.findUnique.mockResolvedValue(
      projectRow({ usedBudget: new Prisma.Decimal(7500.25) }),
    )

    const project = await getProjectById(PID)

    expect(project).not.toBeNull()
    expect(Number(project!.usedBudget)).toBe(7500.25)
    expect(Number(project!.budget)).toBe(50_000)
  })
})
