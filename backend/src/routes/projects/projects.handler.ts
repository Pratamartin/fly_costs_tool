import type { CreateRoute, IndexRoute, ListCostBreakdownsRoute, ReadRoute, RemoveRoute, UpdatePeriodRoute, UpdateRoute } from './projects.route'
import type { AppRouteHandler } from '@/lib/type'
import * as codes from 'stoker/http-status-codes'
import { problems } from '@/lib/problems'
import { ListProjectCostBreakdownsResponseSchema } from '@/schemas/cost-breakdown.schema'
import { ListProjectResponseSchema, ProjectResponseSchema } from '@/schemas/project.schema'
import { createProject, deleteProject, getAllProjects, getProjectById, getProjectCostBreakdowns, updateProject, updateProjectPeriod } from '@/services/project.service'

export const index: AppRouteHandler<IndexRoute> = async (c) => {
  const query = c.req.valid('query')
  const data = await getAllProjects(query)
  const parsed = ListProjectResponseSchema.parse(data)
  return c.json(parsed, codes.OK)
}

export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const data = c.req.valid('json')
  const result = await createProject(data)

  if (result && 'error' in result) {
    throw problems.create(result.error, { extensions: result.context })
  }

  const parsed = ProjectResponseSchema.parse(result)
  return c.json(parsed, codes.CREATED)
}

export const read: AppRouteHandler<ReadRoute> = async (c) => {
  const { id } = c.req.valid('param')
  const result = await getProjectById(id)

  if (result && 'error' in result) {
    throw problems.create(result.error)
  }

  const parsed = ProjectResponseSchema.parse(result)
  return c.json(parsed, codes.OK)
}

export const update: AppRouteHandler<UpdateRoute> = async (c) => {
  const { id } = c.req.valid('param')
  const data = c.req.valid('json')

  const result = await updateProject(id, data)

  if (result && 'error' in result) {
    throw problems.create(result.error, { extensions: result.context })
  }

  const parsed = ProjectResponseSchema.parse(result)
  return c.json(parsed, codes.OK)
}

export const updatePeriod: AppRouteHandler<UpdatePeriodRoute> = async (c) => {
  const { id } = c.req.valid('param')
  const data = c.req.valid('json')

  const result = await updateProjectPeriod(id, data)

  if ('error' in result) {
    throw problems.create(result.error, { extensions: result.context })
  }

  const parsed = ProjectResponseSchema.parse(result)
  return c.json(parsed, codes.OK)
}

export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
  const { id } = c.req.valid('param')
  const result = await deleteProject(id)

  if (result && 'error' in result) {
    throw problems.create(result.error)
  }

  return c.body(null, codes.NO_CONTENT)
}

export const listCostBreakdowns: AppRouteHandler<ListCostBreakdownsRoute> = async (c) => {
  const { id } = c.req.valid('param')
  const query = c.req.valid('query')
  const result = await getProjectCostBreakdowns(id, query)

  if (result && 'error' in result) {
    throw problems.create(result.error, { extensions: result.context })
  }

  c.set('paginationMeta', {
    total: result.total,
    limit: result.limit,
    offset: result.offset,
  })

  const parsed = ListProjectCostBreakdownsResponseSchema.parse(result.data)
  return c.json(parsed, codes.OK)
}
