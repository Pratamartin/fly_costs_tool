import { Decimal } from '@prisma/client/runtime/client'
import * as phrases from 'stoker/http-status-phrases'

import prisma from '@/lib/orm'

type BudgetMetricsResult
  = | { error: string }
    | { total: Decimal, used: Decimal, available: Decimal }

export async function getProjectBudgetMetrics(projectId: string): Promise<BudgetMetricsResult | { error: string }> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      budget: true,
      usedBudget: true,
    },
  })

  if (!project)
    return { error: phrases.NOT_FOUND }

  return {
    total: project.budget,
    used: project.usedBudget,
    available: Decimal(project.budget).minus(project.usedBudget),
  }
}
