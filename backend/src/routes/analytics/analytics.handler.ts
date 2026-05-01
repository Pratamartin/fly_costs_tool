import type { AdminDashboardRoute, TopProjectsRoute } from './analytics.route'
import type { AppRouteHandler } from '@/lib/type'
import * as codes from 'stoker/http-status-codes'
import { getAdminDashboardStats, getTopProjects } from '@/services/analytics.service'

export const adminDashboard: AppRouteHandler<AdminDashboardRoute> = async (c) => {
  const response = await getAdminDashboardStats()

  return c.json({
    ...response,
    totalValue: response.totalValue.toString(),
    budgetCommitted: response.budgetCommitted.toString(),
  }, codes.OK)
}

export const topProjects: AppRouteHandler<TopProjectsRoute> = async (c) => {
  const { limit } = c.req.valid('query')
  const rawProjects = await getTopProjects(limit)

  const response = rawProjects.map(project => ({
    ...project,
    totalValue: project.totalValue.toString(),
  }))

  return c.json(response, codes.OK)
}
