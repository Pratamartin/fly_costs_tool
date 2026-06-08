import type { z } from '@hono/zod-openapi'
import type { Prisma } from '@/generated/prisma/client'
import type { ServiceResult } from '@/lib/problems'
import type { CreateProjectSchema, ListProjectQuerySchema, UpdateProjectSchema } from '@/schemas/project.schema'
import { MAX_SUBCATEGORIES, MIN_SUBCATEGORIES } from '@/constants/project.constant'
import prisma from '@/lib/orm'
import { validateSubcategoriesExist } from './expense.category.service'

type CreateProjectDTO = z.infer<typeof CreateProjectSchema>
type UpdateProjectDTO = z.infer<typeof UpdateProjectSchema>

export const projectInclude = { expenseCategories: { select: { normalizedName: true } } } satisfies Prisma.ProjectInclude

type ProjectPayload = Prisma.ProjectGetPayload<{ include: typeof projectInclude }>

function formatProjectSubcategories(project: ProjectPayload) {
  const { expenseCategories, ...rest } = project
  return {
    ...rest,
    subcategories: expenseCategories.map(c => c.normalizedName),
  }
}

export type ProjectWithSubcategories = ReturnType<typeof formatProjectSubcategories>

export async function createProject(
  data: CreateProjectDTO,
): Promise<ServiceResult<ProjectWithSubcategories, 'PROJECT_CODE_IN_USE' | 'INVALID_SUBCATEGORIES'>> {
  const codeExists = await getProjectByCode(data.code)
  if (!('error' in codeExists)) {
    return { error: 'PROJECT_CODE_IN_USE' }
  }

  if (data.subcategories.length < MIN_SUBCATEGORIES || data.subcategories.length > MAX_SUBCATEGORIES) {
    return { error: 'INVALID_SUBCATEGORIES' }
  }

  if (!await validateSubcategoriesExist(data.subcategories)) {
    return { error: 'INVALID_SUBCATEGORIES' }
  }

  const { subcategories, ...restData } = data

  const project = await prisma.project.create({
    data: {
      ...restData,
      usedBudget: 0,
      isActive: true,
      ...(subcategories && { expenseCategories: { connect: subcategories.map(name => ({ normalizedName: name })) } }),
    },
    include: projectInclude,
  })

  return formatProjectSubcategories(project)
}

export async function getAllProjects(
  filters: z.infer<typeof ListProjectQuerySchema>,
): Promise<ProjectWithSubcategories[]> {
  const { isActive, search } = filters
  const projects = await prisma.project.findMany({
    where: {
      isActive,
      ...(search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                code: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: projectInclude,
  })

  return projects.map(formatProjectSubcategories)
}

export async function getProjectById(
  id: string,
): Promise<ServiceResult<ProjectWithSubcategories, 'PROJECT_NOT_FOUND'>> {
  const project = await prisma.project.findUnique({
    where: { id },
    include: projectInclude,
  })

  if (!project) {
    return { error: 'PROJECT_NOT_FOUND' }
  }

  return formatProjectSubcategories(project)
}

export async function getProjectByCode(
  code: string,
): Promise<ServiceResult<ProjectWithSubcategories, 'PROJECT_NOT_FOUND'>> {
  const project = await prisma.project.findUnique({
    where: { code },
    include: projectInclude,
  })

  if (!project) {
    return { error: 'PROJECT_NOT_FOUND' }
  }

  return formatProjectSubcategories(project)
}

export async function updateProject(
  id: string,
  data: UpdateProjectDTO,
): Promise<ServiceResult<ProjectWithSubcategories, 'PROJECT_NOT_FOUND' | 'PROJECT_ARCHIVED' | 'INVALID_SUBCATEGORIES' | 'PROJECT_CODE_IN_USE'>> {
  const existingResult = await getProjectById(id)

  if ('error' in existingResult) {
    return existingResult
  }

  const existingProject = existingResult

  if (!existingProject.isActive) {
    return { error: 'PROJECT_ARCHIVED' }
  }

  if (data.subcategories && (data.subcategories.length < MIN_SUBCATEGORIES || data.subcategories.length > MAX_SUBCATEGORIES)) {
    return { error: 'INVALID_SUBCATEGORIES' }
  }

  if (data.subcategories && !await validateSubcategoriesExist(data.subcategories)) {
    return { error: 'INVALID_SUBCATEGORIES' }
  }

  if (data.code && data.code !== existingProject.code) {
    const codeExists = await getProjectByCode(data.code)
    if (!('error' in codeExists)) {
      return { error: 'PROJECT_CODE_IN_USE' }
    }
  }

  const { subcategories, ...restData } = data

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...restData,
      ...(subcategories && { expenseCategories: { set: subcategories.map(name => ({ normalizedName: name })) } }),
    },
    include: projectInclude,
  })

  return formatProjectSubcategories(project)
}

export async function deleteProject(
  id: string,
): Promise<ServiceResult<ProjectWithSubcategories, 'PROJECT_NOT_FOUND'>> {
  const existingResult = await getProjectById(id)

  if ('error' in existingResult) {
    return existingResult
  }

  const project = await prisma.project.update({
    where: { id },
    data: { isActive: false },
    include: projectInclude,
  })

  return formatProjectSubcategories(project)
}
