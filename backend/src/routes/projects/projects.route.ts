import type { UserRole } from '@/generated/prisma/enums'
import { createRoute, z } from '@hono/zod-openapi'
import * as codes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { registryResponses, standardResponses } from '@/lib/problems'
import { requireAuth, requireRole } from '@/middlewares'
import { CreateProjectSchema, ListProjectQuerySchema, ListProjectResponseSchema, ProjectResponseSchema, UpdateProjectPeriodSchema, UpdateProjectSchema } from '@/schemas/project.schema'
import { IdSchema } from '@/schemas/shared.schema'

const tags = ['Projects']
const ADMIN_ONLY: UserRole[] = ['ADMIN']

export type CreateRoute = typeof create
export type IndexRoute = typeof index
export type ReadRoute = typeof read
export type UpdateRoute = typeof update
export type UpdatePeriodRoute = typeof updatePeriod
export type RemoveRoute = typeof remove

export const index = createRoute({
  path: '/',
  method: 'get',
  middleware: [requireAuth, requireRole(ADMIN_ONLY)],
  security: [{ bearerAuth: [] }],
  request: { query: ListProjectQuerySchema },
  operationId: 'listProjects',
  summary: 'List projects',
  description: 'Returns a complete list of projects registered in the system, including their budgets and metadata. Role-based constraints: Only `ADMIN` users can access this endpoint.',
  tags,
  responses: {
    [codes.OK]: jsonContent(ListProjectResponseSchema, 'Project list retrieved successfully.'),
    ...standardResponses,
  },
})

export const create = createRoute({
  path: '/',
  method: 'post',
  middleware: [requireAuth, requireRole(ADMIN_ONLY)],
  security: [{ bearerAuth: [] }],
  operationId: 'createProject',
  summary: 'Create a new project',
  description: 'Creates a project by defining a unique identification code, total budget, and associated expense categories. Initial creation automatically sets the used budget to zero and status as active. Returns 409 if the code is already in use.',
  tags,
  request: { body: jsonContentRequired(CreateProjectSchema, 'Project data') },
  responses: {
    [codes.CREATED]: jsonContent(ProjectResponseSchema, 'Project created successfully.'),
    ...standardResponses,
    ...registryResponses('INVALID_SUBCATEGORIES', 'PROJECT_CODE_IN_USE'),
  },
})

export const read = createRoute({
  path: '/{id}',
  method: 'get',
  middleware: [requireAuth, requireRole(ADMIN_ONLY)],
  security: [{ bearerAuth: [] }],
  operationId: 'getProject',
  summary: 'Get project by ID',
  description: 'Retrieves details of a specific project, presenting the real-time balance between total, used, and available budget.',
  tags,
  request: { params: z.object({ id: IdSchema }) },
  responses: {
    [codes.OK]: jsonContent(ProjectResponseSchema, 'Project details found.'),
    ...registryResponses('PROJECT_NOT_FOUND', 'UNAUTHORIZED', 'FORBIDDEN'),
  },
})

export const update = createRoute({
  path: '/{id}',
  method: 'patch',
  middleware: [requireAuth, requireRole(ADMIN_ONLY)],
  security: [{ bearerAuth: [] }],
  operationId: 'updateProject',
  summary: 'Update project',
  description: 'Updates project registration and financial information. If the code is changed, it validates that the new code does not conflict with existing projects (`PROJECT_CODE_IN_USE`).',
  tags,
  request: {
    params: z.object({ id: IdSchema }),
    body: jsonContentRequired(UpdateProjectSchema, 'Data for update'),
  },
  responses: {
    [codes.OK]: jsonContent(ProjectResponseSchema, 'Project updated successfully.'),
    ...standardResponses,
    ...registryResponses('INVALID_SUBCATEGORIES', 'PROJECT_NOT_FOUND', 'PROJECT_CODE_IN_USE'),
  },
})

export const updatePeriod = createRoute({
  path: '/{id}/period',
  method: 'patch',
  middleware: [requireAuth, requireRole(ADMIN_ONLY)],
  security: [{ bearerAuth: [] }],
  operationId: 'updateProjectPeriod',
  summary: 'Update active period',
  description: 'Updates the project\'s temporal validity (start and end dates). Validation applies a "Temporal Shrinkage" check: it blocks the reduction of the period if there are already expense allocations (`CostBreakdown`) that would fall outside the new date bounds (`PROJECT_SHRINKAGE_CONFLICT`).',
  tags,
  request: {
    params: z.object({ id: IdSchema }),
    body: jsonContentRequired(UpdateProjectPeriodSchema, 'Period data for update'),
  },
  responses: {
    [codes.OK]: jsonContent(ProjectResponseSchema, 'Project period updated successfully.'),
    ...standardResponses,
    ...registryResponses('PROJECT_NOT_FOUND', 'PROJECT_ARCHIVED', 'PROJECT_SHRINKAGE_CONFLICT'),
  },
})

export const remove = createRoute({
  path: '/{id}',
  method: 'delete',
  middleware: [requireAuth, requireRole(ADMIN_ONLY)],
  security: [{ bearerAuth: [] }],
  operationId: 'archiveProject',
  summary: 'Archive project',
  description: 'Performs a logical soft delete (`isActive=false`). The project will no longer accept new expenses, but its historical data remains preserved for audits. Fails if the project is already archived.',
  tags,
  request: { params: z.object({ id: IdSchema }) },
  responses: {
    [codes.NO_CONTENT]: { description: 'Project archived successfully.' },
    ...registryResponses('PROJECT_NOT_FOUND', 'STORAGE_PROVIDER_ERROR', 'UNAUTHORIZED', 'FORBIDDEN'),
  },
})
