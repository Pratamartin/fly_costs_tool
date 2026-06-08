import type { UserRole } from '@/generated/prisma/enums'
import { createRoute, z } from '@hono/zod-openapi'
import * as codes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { registryResponses, standardResponses } from '@/lib/problems'
import { requireAuth, requireRole } from '@/middlewares'
import { CreateProjectSchema, ListProjectQuerySchema, ListProjectResponseSchema, ProjectResponseSchema, UpdateProjectSchema } from '@/schemas/project.schema'
import { IdSchema } from '@/schemas/shared.schema'

const tags = ['Projects']
const ADMIN_ONLY: UserRole[] = ['ADMIN']

export type CreateRoute = typeof create
export type IndexRoute = typeof index
export type ReadRoute = typeof read
export type UpdateRoute = typeof update
export type RemoveRoute = typeof remove

export const index = createRoute({
  path: '/',
  method: 'get',
  middleware: [requireAuth, requireRole(ADMIN_ONLY)],
  security: [{ bearerAuth: [] }],
  request: { query: ListProjectQuerySchema },
  summary: 'List all projects',
  description: 'Returns the complete list of projects registered in the system, including budgets and metadata.',
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
  summary: 'Create a new project',
  description: `
    Allows creating a new project by defining a unique identification code, total budget, and categories.
    Initial creation sets the used budget to zero and status as active by default.
  `,
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
  summary: 'Get project by ID',
  description: 'Retrieves details of a specific project, presenting the balance between total, used, and available budget.',
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
  summary: 'Update project',
  description: `
    Allows updating project registration and financial information.
    If the code is changed, the system will validate that the new value does not already belong to another existing project.
  `,
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

export const remove = createRoute({
  path: '/{id}',
  method: 'delete',
  middleware: [requireAuth, requireRole(ADMIN_ONLY)],
  security: [{ bearerAuth: [] }],
  summary: 'Archive project (Soft Delete)',
  description: `
    Performs logical archiving of the project (isActive=false).
    The project will no longer accept new expenses, but its historical data remains preserved for audit purposes.
  `,
  tags,
  request: { params: z.object({ id: IdSchema }) },
  responses: {
    [codes.NO_CONTENT]: { description: 'Project archived successfully.' },
    ...registryResponses('PROJECT_NOT_FOUND', 'UNAUTHORIZED', 'FORBIDDEN'),
  },
})
