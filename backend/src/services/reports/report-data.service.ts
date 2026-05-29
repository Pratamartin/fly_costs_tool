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
import { extractTripInfo, formatCurrency } from './report-formatter.logic'

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
    filters.projectId = projectId
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
  const rows: ReportRow[] = expenses.map(expense => transformToReportRow(expense))
  const analytics = calculateReportAnalytics(expenses)

  return {
    rows,
    analytics,
    isTruncated: expenses.length === REPORT_PDF_CONFIG.MAX_RECORDS,
  }
}

function transformToReportRow(expense: ExpenseWithRelations): ReportRow {
  const tripInfo = extractTripInfo(expense)

  const totalRaw = expense.costBreakdowns.reduce(
    (acc, cb) => acc.add(cb.amount),
    new Prisma.Decimal(0),
  )

  return {
    id: expense.id,
    studentName: expense.student?.name || 'N/A',
    projectName: expense.project?.name || 'Não Atribuído',
    projectCode: expense.project?.code || 'N/A',
    status: expense.status,
    destination: tripInfo.destination,
    period: tripInfo.period,
    totalRaw,
    totalDisplay: formatCurrency(totalRaw),
    breakdown: expense.costBreakdowns.map(cb => ({
      category: cb.expenseCategory.name,
      amountDisplay: formatCurrency(cb.amount),
    })),
  }
}
