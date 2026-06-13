import type { UserRole } from '@/generated/prisma/enums'
import { createRoute } from '@hono/zod-openapi'
import * as codes from 'stoker/http-status-codes'
import { jsonContent } from 'stoker/openapi/helpers'
import { registryResponses, standardResponses } from '@/lib/problems'
import { requireAuth, requireRole } from '@/middlewares'
import { AdminDashboardResponseSchema, TopProjectsQuerySchema, TopProjectsResponseSchema } from '@/schemas/analytics.schema'

const tags = ['Analytics']
const ADMIN_ONLY: UserRole[] = ['ADMIN']

export type AdminDashboardRoute = typeof adminDashboard
export type TopProjectsRoute = typeof topProjects

export const adminDashboard = createRoute({
  path: '/admin-dashboard',
  method: 'get',
  middleware: [requireAuth, requireRole(ADMIN_ONLY)],
  security: [{ bearerAuth: [] }],
  summary: 'Admin dashboard statistics',
  description: 'Returns aggregated metrics of requests for the administrative panel.',
  tags,
  responses: {
    [codes.OK]: jsonContent(AdminDashboardResponseSchema, 'Administrative statistics retrieved successfully.'),
    ...registryResponses('UNAUTHORIZED', 'FORBIDDEN'),
  },
})

export const topProjects = createRoute({
  path: '/top-projects',
  method: 'get',
  middleware: [requireAuth, requireRole(ADMIN_ONLY)],
  security: [{ bearerAuth: [] }],
  summary: 'Top projects by approved expenses',
  description: 'Returns the N most relevant projects based on the approved value of expense requests.',
  tags,
  request: { query: TopProjectsQuerySchema },
  responses: {
    [codes.OK]: jsonContent(TopProjectsResponseSchema, 'Top projects list retrieved successfully.'),
    ...standardResponses,
  },
})
