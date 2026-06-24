import type { z } from '@hono/zod-openapi'
import type { Prisma, Project } from '@/generated/prisma/client'
import type { ServiceResult } from '@/lib/problems'
import type { CreateProjectSchema, ListProjectQuerySchema, UpdateProjectPeriodSchema, UpdateProjectSchema } from '@/schemas/project.schema'
import dayjs from 'dayjs'
import { MAX_SUBCATEGORIES, MIN_SUBCATEGORIES } from '@/constants/project.constant'
import prisma from '@/lib/orm'
import { deleteObjects, isStorageConfigured } from '@/lib/storage'
import { validateSubcategoriesExist } from './expense.category.service'

type CreateProjectDTO = z.infer<typeof CreateProjectSchema>
type UpdateProjectDTO = z.infer<typeof UpdateProjectSchema>
type UpdateProjectPeriodDTO = z.infer<typeof UpdateProjectPeriodSchema>

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

export function validateDateWithinProjectPeriod(
  date: Date | string,
  project: Pick<Project, 'startDate' | 'endDate'>,
): ServiceResult<{ success: true }, 'PROJECT_PERIOD_EXPIRED'> {
  const targetDate = dayjs(date)
  const isBeforeStart = project.startDate && targetDate.isBefore(project.startDate)
  const isAfterEnd = project.endDate && targetDate.isAfter(project.endDate)

  if (isBeforeStart || isAfterEnd) {
    return {
      error: 'PROJECT_PERIOD_EXPIRED',
      context: {
        projectStartDate: project.startDate.toISOString(),
        projectEndDate: project.endDate.toISOString(),
      },
    }
  }

  return { success: true }
}

export async function createProject(
  data: CreateProjectDTO,
): Promise<ServiceResult<ProjectWithSubcategories, 'PROJECT_CODE_IN_USE' | 'INVALID_SUBCATEGORIES'>> {
  const codeExists = await getProjectByCode(data.code)
  if (!('error' in codeExists)) {
    return { error: 'PROJECT_CODE_IN_USE' }
  }

  if (data.subcategories.length < MIN_SUBCATEGORIES || data.subcategories.length > MAX_SUBCATEGORIES) {
    return {
      error: 'INVALID_SUBCATEGORIES',
      context: {
        minAllowed: MIN_SUBCATEGORIES,
        maxAllowed: MAX_SUBCATEGORIES,
        received: data.subcategories.length,
      },
    }
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
    return {
      error: 'INVALID_SUBCATEGORIES',
      context: {
        minAllowed: MIN_SUBCATEGORIES,
        maxAllowed: MAX_SUBCATEGORIES,
        received: data.subcategories.length,
      },
    }
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

export async function updateProjectPeriod(
  id: string,
  data: UpdateProjectPeriodDTO,
): Promise<ServiceResult<ProjectWithSubcategories, 'PROJECT_NOT_FOUND' | 'PROJECT_ARCHIVED' | 'PROJECT_SHRINKAGE_CONFLICT'>> {
  const existingResult = await getProjectById(id)

  if ('error' in existingResult) {
    return existingResult
  }

  const existingProject = existingResult

  if (!existingProject.isActive) {
    return { error: 'PROJECT_ARCHIVED' }
  }

  const isStartDateDelayed = dayjs(data.startDate).isAfter(dayjs(existingProject.startDate))
  const isEndDateAdvanced = dayjs(data.endDate).isBefore(dayjs(existingProject.endDate))

  if (isStartDateDelayed || isEndDateAdvanced) {
    const orConditions: NonNullable<Prisma.CostBreakdownWhereInput['OR']> = []
    orConditions.push({ createdAt: { lt: data.startDate } })
    orConditions.push({ createdAt: { gt: data.endDate } })

    const orphanedCostAllocationsCount = await prisma.costBreakdown.count({
      where: {
        projectId: id,
        OR: orConditions,
      },
    })

    if (orphanedCostAllocationsCount > 0) {
      return {
        error: 'PROJECT_SHRINKAGE_CONFLICT',
        context: { orphanedCostAllocationsCount },
      }
    }
  }

  const project = await prisma.project.update({
    where: { id },
    data: {
      startDate: data.startDate,
      endDate: data.endDate,
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

  // Coleciona todas as attachmentKeys das expenses associadas
  const expenses = await prisma.expenseRequest.findMany({
    where: { costBreakdowns: { some: { projectId: id } } },
    select: {
      attachmentKey: true,
      costBreakdowns: {
        where: { projectId: id },
        select: { attachmentKey: true },
      },
    },
  })

  const keys = expenses.flatMap(e => [
    e.attachmentKey,
    ...e.costBreakdowns.map(cb => cb.attachmentKey),
  ]).filter((k): k is string => k !== null)

  return prisma.$transaction(async (tx) => {
    if (keys.length > 0 && isStorageConfigured()) {
      await deleteObjects(keys)
    }

    const project = await tx.project.update({
      where: { id },
      data: { isActive: false },
      include: projectInclude,
    })

    return formatProjectSubcategories(project)
  })
}
