import type { z } from '@hono/zod-openapi'
import type { Prisma } from '@/generated/prisma/client'
import type { CreateProjectSchema, ListProjectQuerySchema, UpdateProjectSchema } from '@/schemas/project.schema'
import * as phrases from 'stoker/http-status-phrases'
import { MAX_SUBCATEGORIES, MIN_SUBCATEGORIES, PROJECT_ERROR_CODES } from '@/constants/project.constant'
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
): Promise<ProjectWithSubcategories | { error: string }> {
  const codeExists = await getProjectByCode(data.code)
  if (codeExists) {
    return { error: phrases.CONFLICT }
  }

  if (data.subcategories.length < MIN_SUBCATEGORIES || data.subcategories.length > MAX_SUBCATEGORIES) {
    return { error: PROJECT_ERROR_CODES.INVALID_SUBCATEGORIES_COUNT }
  }

  if (!await validateSubcategoriesExist(data.subcategories)) {
    return { error: PROJECT_ERROR_CODES.SUBCATEGORIES_NOT_FOUND }
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
): Promise<ProjectWithSubcategories | null> {
  const project = await prisma.project.findUnique({
    where: { id },
    include: projectInclude,
  })
  return project ? formatProjectSubcategories(project) : null
}

export async function getProjectByCode(
  code: string,
): Promise<ProjectWithSubcategories | null> {
  const project = await prisma.project.findUnique({
    where: { code },
    include: projectInclude,
  })
  return project ? formatProjectSubcategories(project) : null
}

export async function updateProject(
  id: string,
  data: UpdateProjectDTO,
): Promise<ProjectWithSubcategories | { error: string }> {
  const existingProject = await getProjectById(id)

  if (!existingProject) {
    return { error: phrases.NOT_FOUND }
  }

  if (!existingProject.isActive) {
    return { error: PROJECT_ERROR_CODES.PROJECT_ARCHIVED }
  }

  if (data.subcategories && (data.subcategories.length < MIN_SUBCATEGORIES || data.subcategories.length > MAX_SUBCATEGORIES)) {
    return { error: PROJECT_ERROR_CODES.INVALID_SUBCATEGORIES_COUNT }
  }

  if (data.subcategories && !await validateSubcategoriesExist(data.subcategories)) {
    return { error: PROJECT_ERROR_CODES.SUBCATEGORIES_NOT_FOUND }
  }

  if (data.code && data.code !== existingProject.code) {
    const codeExists = await getProjectByCode(data.code)
    if (codeExists) {
      return { error: phrases.CONFLICT }
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
): Promise<ProjectWithSubcategories | { error: string }> {
  const existingProject = await getProjectById(id)

  if (!existingProject) {
    return { error: phrases.NOT_FOUND }
  }

  const project = await prisma.project.update({
    where: { id },
    data: { isActive: false },
    include: projectInclude,
  })

  return formatProjectSubcategories(project)
}
