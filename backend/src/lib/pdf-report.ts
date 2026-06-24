import type { Content, TableCell, TDocumentDefinitions, TFontDictionary } from 'pdfmake/interfaces'
import type { ReportAnalytics, ReportRow, ReportViewModel } from '@/services/reports'
import pdfmake from 'pdfmake'
import { REPORT_PDF_CONFIG, REPORT_TRANSLATIONS } from '@/constants/expense.report.constant'
import { formatCurrency } from '@/services/reports'
import { dayjs } from './date'

const fonts: TFontDictionary = {
  Roboto: {
    normal: 'node_modules/pdfmake/fonts/Roboto/Roboto-Regular.ttf',
    bold: 'node_modules/pdfmake/fonts/Roboto/Roboto-Medium.ttf',
    italics: 'node_modules/pdfmake/fonts/Roboto/Roboto-Italic.ttf',
    bolditalics: 'node_modules/pdfmake/fonts/Roboto/Roboto-MediumItalic.ttf',
  },
}

// @ts-expect-error - pdfmake singleton might have different types in 0.3.x
const pdfInstance = (pdfmake.default || pdfmake)
pdfInstance.setFonts(fonts)

export async function generateExpenseReportPDF(
  viewModel: ReportViewModel,
  filters: Record<string, unknown>,
) {
  const { rows, analytics } = viewModel

  const docDefinition: TDocumentDefinitions = {
    content: [
      {
        text: 'Relatório de Despesas',
        style: 'header',
      },
      {
        text: `Gerado em: ${dayjs().format(REPORT_PDF_CONFIG.DATE_FORMAT)}`,
        style: 'subheader',
      },

      renderFilters(filters),
      renderAnalyticsCards(analytics),

      {
        text: 'Detalhamento das Solicitações',
        style: 'sectionTitle',
        margin: [0, 20, 0, 10],
      },

      renderTable(rows),
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 5],
      },
      subheader: {
        fontSize: 10,
        italics: true,
        margin: [0, 0, 0, 15],
        color: REPORT_PDF_CONFIG.COLORS.SUBHEADER,
      },
      sectionTitle: {
        fontSize: 12,
        bold: true,
        color: '#333333',
      },
      filterSection: { margin: [0, 0, 0, 15] },
      filterTitle: {
        fontSize: 10,
        bold: true,
      },

      cardTitle: {
        fontSize: 9,
        color: '#666666',
        bold: true,
      },
      cardValue: {
        fontSize: 14,
        bold: true,
        color: '#2563eb',
      },

      tableHeader: {
        fontSize: 10,
        bold: true,
        fillColor: REPORT_PDF_CONFIG.COLORS.TABLE_HEADER_FILL,
        margin: [5, 5, 5, 5],
      },
      tableCell: {
        fontSize: 9,
        margin: [5, 5, 5, 5],
      },

      costCategory: {
        fontSize: 8,
        color: '#444444',
      },
      costAmount: {
        fontSize: 8,
        alignment: 'right',
      },
      costTotal: {
        fontSize: 9,
        bold: true,
        alignment: 'right',
        margin: [0, 2, 0, 0],
      },
    },
    defaultStyle: { font: 'Roboto' },
    pageOrientation: REPORT_PDF_CONFIG.PAGE_ORIENTATION,
  }

  const doc = pdfInstance.createPdf(docDefinition)
  return doc.getStream()
}

function renderAnalyticsCards(analytics: ReportAnalytics): Content {
  const topCategories = Object.entries(analytics.byCategory)
    .sort((a, b) => b[1].comparedTo(a[1]))
    .slice(0, 3)
    .map(([name, total]) => `${name}: ${formatCurrency(total)}`)
    .join('\n')

  return {
    columns: [
      {
        stack: [
          {
            text: 'TOTAL GASTO',
            style: 'cardTitle',
          },
          {
            text: formatCurrency(analytics.totalAmount),
            style: 'cardValue',
          },
        ],
        width: '*',
      },
      {
        stack: [
          {
            text: 'SOLICITAÇÕES',
            style: 'cardTitle',
          },
          {
            text: String(analytics.totalRequests),
            style: 'cardValue',
          },
        ],
        width: '*',
      },
      {
        stack: [
          {
            text: 'MAIORES GASTOS',
            style: 'cardTitle',
          },
          {
            text: topCategories || 'N/A',
            style: 'tableCell',
            margin: [0, 2, 0, 0],
          },
        ],
        width: '*',
      },
    ],
    margin: [0, 0, 0, 20],
    columnGap: 10,
  }
}

function renderFilters(filters: Record<string, unknown>): Content {
  const filterEntries = Object.entries(filters)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      let displayValue = String(value)
      if (value instanceof Date)
        displayValue = dayjs(value).format(REPORT_PDF_CONFIG.FILTER_DATE_FORMAT)
      return {
        text: [{
          text: `${translateFilterKey(key)}: `,
          bold: true,
        }, displayValue],
      }
    })

  if (filterEntries.length === 0) {
    return {
      text: 'Filtros: Nenhum',
      style: 'filterSection',
    }
  }

  return {
    stack: [
      {
        text: 'Filtros aplicados:',
        style: 'filterTitle',
      },
      {
        ul: filterEntries,
        margin: [0, 5, 0, 0],
      },
    ],
    style: 'filterSection',
  }
}

function translateFilterKey(key: string) {
  return (REPORT_TRANSLATIONS as any)[key] || key
}

function renderTable(rows: ReportRow[]): Content {
  const body: TableCell[][] = [
    [
      {
        text: 'Aluno',
        style: 'tableHeader',
      },
      {
        text: 'Destino',
        style: 'tableHeader',
      },
      {
        text: 'Período',
        style: 'tableHeader',
      },
      {
        text: 'Composição do Gasto',
        style: 'tableHeader',
        alignment: 'right',
      },
      {
        text: 'Status',
        style: 'tableHeader',
      },
    ],
    ...rows.map(row => [
      {
        text: row.studentName,
        style: 'tableCell',
      },
      {
        text: row.destination,
        style: 'tableCell',
      },
      {
        text: row.period,
        style: 'tableCell',
      },
      {
        stack: [
          ...row.breakdown.map(item => ({
            columns: [
              {
                text: item.projectCode ? `${item.category} (${item.projectCode})` : item.category,
                style: 'costCategory',
              },
              {
                text: item.amountDisplay,
                style: 'costAmount',
              },
            ],
          })),
          {
            canvas: [{
              type: 'line',
              x1: 0,
              y1: 2,
              x2: 100,
              y2: 2,
              lineWidth: 0.5,
              lineColor: '#eeeeee',
            }],
          },
          {
            text: row.totalDisplay,
            style: 'costTotal',
          },
        ],
        margin: [0, 2, 0, 2],
      } as TableCell,
      {
        text: row.status,
        style: 'tableCell',
      },
    ]),
  ]

  return {
    table: {
      headerRows: 1,
      widths: ['auto', '*', 'auto', 'auto', 'auto'],
      body,
    },
    layout: 'lightHorizontalLines',
  }
}
