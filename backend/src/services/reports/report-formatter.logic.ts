import type { Prisma } from '@/generated/prisma/client'
import type { ExpenseWithRelations } from '@/services/expense.service'
import { REPORT_PDF_CONFIG } from '@/constants/expense.report.constant'
import { eventJSONSchema } from '@/json'
import { dayjs } from '@/lib/date'

export type ReportSchemaProperty = {
  'type'?: string
  'format'?: string
  'x-report'?: boolean
  [key: string]: unknown
}

export type ReportSchema = {
  properties?: Record<string, ReportSchemaProperty>
  [key: string]: unknown
}

export type ExtractedReportInfo = {
  destination: string
  period: string
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}/

export function formatCurrency(value: number | Prisma.Decimal): string {
  const amount = typeof value === 'number' ? value : value.toNumber()

  return new Intl.NumberFormat(REPORT_PDF_CONFIG.LOCALE, {
    style: 'currency',
    currency: REPORT_PDF_CONFIG.CURRENCY,
  }).format(amount)
}

export function extractTripInfo(expense: ExpenseWithRelations): ExtractedReportInfo {
  const allTexts: string[] = []
  const allDates: string[] = []

  for (const answer of expense.surveyAnswers) {
    const schema = answer.survey.schema as unknown as ReportSchema
    const data = answer.data as Prisma.JsonObject
    const { texts, dates } = extractFromSchema(schema, data)

    allTexts.push(...texts)
    allDates.push(...dates)
  }

  if (allTexts.length > 0 || allDates.length > 0) {
    const uniqueTexts = Array.from(new Set(allTexts))

    return {
      destination: uniqueTexts.join(' - ') || 'N/A',
      period: formatPeriod(allDates),
    }
  }

  // 3. Fallback: Se nenhuma preferência tinha marcação x-report, usa o Evento
  const eventData = expense.event as Prisma.JsonObject
  const eventExtracted = extractFromSchema(eventJSONSchema as unknown as ReportSchema, eventData)

  return {
    destination: eventExtracted.texts.join(' - ') || 'N/A',
    period: dayjs(expense.createdAt).format(REPORT_PDF_CONFIG.FILTER_DATE_FORMAT),
  }
}

export function extractFromSchema(schema: ReportSchema, data: Prisma.JsonObject | null) {
  const texts: string[] = []
  const dates: string[] = []

  if (!schema?.properties || !data) {
    return {
      texts,
      dates,
    }
  }

  for (const key of Object.keys(schema.properties)) {
    const prop = schema.properties[key]
    const value = data[key]

    if (prop && prop['x-report'] && value !== undefined && value !== null) {
      const stringValue = String(value)
      const isDate = prop.format === 'date' || DATE_REGEX.test(stringValue)

      if (isDate)
        dates.push(stringValue)
      else texts.push(stringValue)
    }
  }

  return {
    texts,
    dates,
  }
}

export function formatPeriod(dates: string[]): string {
  if (dates.length === 0)
    return 'N/A'

  const uniqueDates = Array.from(new Set(dates))

  return uniqueDates
    .sort((a, b) => dayjs(a).valueOf() - dayjs(b).valueOf())
    .map(d => dayjs(d).format(REPORT_PDF_CONFIG.FILTER_DATE_FORMAT))
    .join(' - ')
}
