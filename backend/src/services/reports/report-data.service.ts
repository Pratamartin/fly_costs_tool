import type { z } from '@hono/zod-openapi'
import type { ExpenseWithRelations } from '../expense.service'
import type { ReportAnalytics } from './report-analytics.logic'
import type { ExtractedReportInfo } from './report-formatter.logic'
import type { ExpenseReportQuerySchema } from '@/schemas/expense.schema'
import { EXPENSE_VISIBILITY_BY_ROLE } from '@/constants/expense.constant'
import { REPORT_PDF_CONFIG } from '@/constants/expense.report.constant'
import { Prisma } from '@/generated/prisma/client'
import { UserRole } from '@/generated/prisma/enums'
import prisma from '@/lib/orm'
import { expenseInclude } from '../expense.service'
import { calculateReportAnalytics } from './report-analytics.logic'
import { extractTripInfo, formatCurrency, getOneLinerUniqueProjectsFromBreakdowns } from './report-formatter.logic'

export type ReportRow = {
  id: string
  studentName: string
  projectName: string
  projectCode: string
  status: string
  totalRaw: Prisma.Decimal
  totalDisplay: string
  breakdown: {
    category: string
    projectCode: string | null
    amountDisplay: string
  }[]
} & ExtractedReportInfo

export type ReportViewModel = {
  rows: ReportRow[]
  analytics: ReportAnalytics
  isTruncated: boolean
}

export async function getReportViewModel(
  userId: string,
  role: UserRole,
  query: z.infer<typeof ExpenseReportQuerySchema>,
): Promise<ReportViewModel> {
  const { from, to, status, projectId, studentId } = query

  const visibility = role === UserRole.ALUNO
    ? { studentId: userId }
    : { status: { in: EXPENSE_VISIBILITY_BY_ROLE[role] } }

  const filters: any = {}
  if (from || to) {
    filters.createdAt = {
      ...(from && { gte: from }),
      ...(to && { lte: to }),
    }
  }

  if (status)
    filters.status = status
  if (projectId)
    filters.costBreakdowns = { some: { projectId } }
  if (studentId && role !== UserRole.ALUNO) {
    filters.studentId = studentId
  }

  const expenses = await prisma.expenseRequest.findMany({
    where: { AND: [filters, visibility] },
    include: expenseInclude,
    orderBy: { createdAt: 'desc' },
    take: REPORT_PDF_CONFIG.MAX_RECORDS,
  })

  // Transforma os dados em ViewModel mantendo a precisão Decimal
  const rows: ReportRow[] = expenses.map(expense => transformToReportRow(expense, projectId))
  const analytics = calculateReportAnalytics(expenses, projectId)

  return {
    rows,
    analytics,
    isTruncated: expenses.length === REPORT_PDF_CONFIG.MAX_RECORDS,
  }
}

function transformToReportRow(expense: ExpenseWithRelations, projectIdFilter?: string): ReportRow {
  const tripInfo = extractTripInfo(expense)

  const relevantBreakdowns = projectIdFilter
    ? expense.costBreakdowns.filter(cb => cb.projectId === projectIdFilter)
    : expense.costBreakdowns

  const totalRaw = relevantBreakdowns.reduce(
    (acc, cb) => acc.add(cb.amount),
    new Prisma.Decimal(0),
  )

  const { names, codes } = getOneLinerUniqueProjectsFromBreakdowns(relevantBreakdowns)

  return {
    id: expense.id,
    studentName: expense.student?.name || 'N/A',
    projectName: names,
    projectCode: codes,
    status: expense.status,
    destination: tripInfo.destination,
    period: tripInfo.period,
    totalRaw,
    totalDisplay: formatCurrency(totalRaw),
    breakdown: relevantBreakdowns.map(cb => ({
      category: cb.expenseCategory.name,
      projectCode: cb.project?.code || null,
      amountDisplay: formatCurrency(cb.amount),
    })),
  }
}
