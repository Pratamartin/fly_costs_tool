import type { UserRole } from '@/generated/prisma/enums'
import { createRoute } from '@hono/zod-openapi'
import * as codes from 'stoker/http-status-codes'
import { jsonContent } from 'stoker/openapi/helpers'
import { requireAuth, requireRole } from '@/middlewares'
import { AdminDashboardResponseSchema, TopProjectsResponseSchema } from '@/schemas/analytics.schema'
import { ForbiddenResponse, UnauthorizedResponse } from '@/schemas/shared.schema'

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
  description: 'Retorna métricas agregadas de solicitações para o painel administrativo.',
  tags,
  responses: {
    [codes.OK]: jsonContent(AdminDashboardResponseSchema, 'Estatísticas administrativas retornadas com sucesso.'),
    [codes.UNAUTHORIZED]: UnauthorizedResponse,
    [codes.FORBIDDEN]: ForbiddenResponse,
  },
})

export const topProjects = createRoute({
  path: '/top-projects',
  method: 'get',
  middleware: [requireAuth, requireRole(ADMIN_ONLY)],
  security: [{ bearerAuth: [] }],
  summary: 'Top 5 projects by approved expenses',
  description: 'Retorna os cinco projetos mais relevantes com base no valor aprovado das solicitações de despesa.',
  tags,
  responses: {
    [codes.OK]: jsonContent(TopProjectsResponseSchema, 'Lista de top projects retornada com sucesso.'),
    [codes.UNAUTHORIZED]: UnauthorizedResponse,
    [codes.FORBIDDEN]: ForbiddenResponse,
  },
})
