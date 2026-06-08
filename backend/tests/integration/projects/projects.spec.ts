import type { z } from '@hono/zod-openapi'
import type { CreateProjectSchema } from '@/schemas/project.schema'
import { testClient } from 'hono/testing'
import * as status from 'stoker/http-status-codes'
import { afterAll, assert, beforeAll, describe, expect, it } from 'vitest'
import { createTestApp } from '@/lib/config'
import prisma from '@/lib/orm'
import { projects } from '@/routes'
import { seedExpenseCategories, seedUsers } from '@/seeds'
import { dummyExpenseCategories } from '@/seeds/expense.category.seed'
import { getAuthHeaders } from '../../util'
import { expectProblem } from '../../util/assertions'

const client = testClient(createTestApp(projects))

describe('[Projects] - Gestão de Projetos', () => {
  let adminHeaders: { Authorization: string }
  const subcategory = dummyExpenseCategories[0]!.normalizedName

  beforeAll(async () => {
    await seedUsers()
    await seedExpenseCategories()
    adminHeaders = await getAuthHeaders('admin@test.com', 'ADMIN')
  })

  afterAll(async () => {
    await prisma.project.deleteMany()
    await prisma.expenseCategory.deleteMany()
    await prisma.user.deleteMany()
  })

  const basePayload: z.infer<typeof CreateProjectSchema> = {
    name: 'Projeto de Teste',
    code: 'TEST-001',
    budget: 5000,
    subcategories: [subcategory],
  }

  it('[SUCESSO]: Deve criar um projeto válido', async () => {
    const res = await client.projects.$post({ json: basePayload }, { headers: adminHeaders })

    expect(res.status).toBe(status.CREATED)
    assert(res.status === status.CREATED)

    const json = await res.json()
    expect(json).toMatchObject({
      name: basePayload.name,
      code: basePayload.code,
      budget: basePayload.budget,
      isActive: true,
    })
    expect(json.subcategories).toContain(subcategory)
  })

  it('[ERRO]: Deve falhar ao criar projeto com código duplicado (PROJECT_CODE_IN_USE)', async () => {
    const res = await client.projects.$post({ json: basePayload }, { headers: adminHeaders })

    await expectProblem(res, 'PROJECT_CODE_IN_USE')
  })

  it('[ERRO]: Deve falhar ao criar projeto com subcategorias inválidas (INVALID_SUBCATEGORIES)', async () => {
    const res = await client.projects.$post({
      json: {
        ...basePayload,
        code: 'TEST-002',
        subcategories: ['CATEGORIA_INEXISTENTE'],
      },
    }, { headers: adminHeaders })

    await expectProblem(res, 'INVALID_SUBCATEGORIES')
  })

  it('[SUCESSO]: Deve listar projetos ativos', async () => {
    const res = await client.projects.$get({ query: { isActive: true } }, { headers: adminHeaders })

    if (res.status !== status.OK) {
      console.error('[DEBUG] PROJECTS LIST FAIL:', res.status, await res.json())
    }

    expect(res.status).toBe(status.OK)
    assert(res.status === status.OK)

    const json = await res.json()
    expect(Array.isArray(json)).toBe(true)
    expect(json.length).toBeGreaterThanOrEqual(1)
  })

  it('[SUCESSO]: Deve buscar projeto por ID', async () => {
    const project = await prisma.project.findFirst({ where: { code: basePayload.code } })

    const res = await client.projects[':id'].$get({ param: { id: project!.id } }, { headers: adminHeaders })

    expect(res.status).toBe(status.OK)
    assert(res.status === status.OK)

    const json = await res.json()
    expect(json.id).toBe(project!.id)
  })

  it('[ERRO]: Deve retornar 404 para projeto inexistente (PROJECT_NOT_FOUND)', async () => {
    const res = await client.projects[':id'].$get({ param: { id: '00000000-0000-0000-0000-000000000000' } }, { headers: adminHeaders })

    await expectProblem(res, 'PROJECT_NOT_FOUND')
  })

  describe('validações Semânticas (RFC 9457)', () => {
    it('deve retornar erro de validação para budget com tipo inválido (invalid_type)', async () => {
      const res = await client.projects.$post({
        json: {
          ...basePayload,
          budget: 'dez mil' as any,
        },
      }, { headers: adminHeaders })

      const json = await expectProblem(res, 'VALIDATION_ERROR')
      const errorField = json.errors.find(e => e.field === 'budget')
      expect(errorField).toBeDefined()
      assert(errorField)
      expect(errorField.code).toBe('invalid_type')
      expect(errorField.params).toMatchObject({
        expected: 'number',
        received: 'NaN',
      })
    })

    it('deve retornar erro de validação para subcategorias vazias (too_small)', async () => {
      const res = await client.projects.$post({
        json: {
          ...basePayload,
          subcategories: [],
        },
      }, { headers: adminHeaders })

      const json = await expectProblem(res, 'VALIDATION_ERROR')
      const errorField = json.errors.find(e => e.field === 'subcategories')
      expect(errorField).toBeDefined()
      assert(errorField)
      expect(errorField.code).toBe('too_small')
      expect(errorField.params).toMatchObject({
        origin: 'array',
        minimum: 1,
      })
    })
  })

  it('[SUCESSO]: Deve atualizar um projeto', async () => {
    const project = await prisma.project.findFirst({ where: { code: basePayload.code } })

    const res = await client.projects[':id'].$patch({
      param: { id: project!.id },
      json: { name: 'Nome Atualizado' },
    }, { headers: adminHeaders })

    expect(res.status).toBe(status.OK)
    assert(res.status === status.OK)

    const json = await res.json()
    expect(json.name).toBe('Nome Atualizado')
  })

  it('[SUCESSO]: Deve arquivar um projeto (Soft Delete)', async () => {
    const project = await prisma.project.findFirst({ where: { code: basePayload.code } })

    const res = await client.projects[':id'].$delete({ param: { id: project!.id } }, { headers: adminHeaders })

    expect(res.status).toBe(status.NO_CONTENT)

    const updated = await prisma.project.findUnique({ where: { id: project!.id } })
    expect(updated?.isActive).toBe(false)
  })

  it('[ERRO]: Deve falhar ao atualizar um projeto arquivado (PROJECT_ARCHIVED)', async () => {
    const project = await prisma.project.findFirst({ where: { isActive: false } })

    const res = await client.projects[':id'].$patch({
      param: { id: project!.id },
      json: { name: 'Tentativa de Update' },
    }, { headers: adminHeaders })

    await expectProblem(res, 'PROJECT_ARCHIVED')
  })
})
