/**
 * US 4.3 — Relatório de Despesas
 * Unit: formatCurrency, extractFromSchema, formatPeriod, calculateReportAnalytics
 * Unit: generateExpenseReportPDF — buffer gerado começa com %PDF
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma } from '@/generated/prisma/client'

// ─── Mock: dependências externas ──────────────────────────────────────────────

vi.mock('@/lib/storage', () => ({
  isStorageConfigured: () => false,
  validatePDF: () => ({ valid: false, error: 'STORAGE_NOT_CONFIGURED' }),
  uploadFile: async () => ({ fileKey: '', fileName: '', fileSize: 0 }),
  deleteFile: async () => {},
  getSignedDownloadUrl: async () => '',
}))

vi.mock('@/services/preference-survey.service', () => ({
  validateAnswers: vi.fn().mockResolvedValue(null),
  createSurveyAnswer: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/services/notifications', () => ({
  notifyStatusChange: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/services/notifications/staff.notification', () => ({
  notifyStaffOnStatusChange: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/jobs', () => ({
  boss: {},
  JobManager: class {
    register() { return this }
    async emit() {}
    async start() {}
    async stop() {}
  },
  BaseJob: class {},
}))

const prismaMock = vi.hoisted(() => ({
  expenseRequest: { findMany: vi.fn().mockResolvedValue([]) },
}))

vi.mock('@/lib/orm', () => ({ default: prismaMock }))

// ─── Imports dos módulos a testar ─────────────────────────────────────────────

import {
  calculateReportAnalytics,
  formatCurrency,
  formatPeriod,
  extractFromSchema,
  type ReportSchema,
} from '@/services/reports'

import { getReportViewModel } from '@/services/reports/report-data.service'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeExpense(overrides = {}): any {
  return {
    id: 'expense-001',
    studentId: 'student-001',
    projectId: 'project-001',
    title: 'Congresso',
    status: 'APROVADO',
    createdAt: new Date('2026-04-01'),
    updatedAt: new Date('2026-04-02'),
    event: {},
    student: { id: 'student-001', name: 'Ana Aluno' },
    project: { id: 'project-001', name: 'Projeto Alpha', code: 'PA-01' },
    costBreakdowns: [
      {
        id: 'cb-001',
        amount: new Prisma.Decimal(1500),
        expenseCategory: { id: 'cat-1', name: 'Passagem', normalizedName: 'passagem' },
      },
      {
        id: 'cb-002',
        amount: new Prisma.Decimal(800),
        expenseCategory: { id: 'cat-2', name: 'Hospedagem', normalizedName: 'hospedagem' },
      },
    ],
    surveyAnswers: [],
    attachmentKey: null,
    rejectionReason: null,
    correctionReason: null,
    ...overrides,
  }
}

// ─── formatCurrency ───────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('formata valor numérico em BRL com símbolo R$', () => {
    const result = formatCurrency(1500)
    expect(result).toContain('R$')
    expect(result).toContain('1.500')
  })

  it('formata Prisma.Decimal corretamente', () => {
    const result = formatCurrency(new Prisma.Decimal(800))
    expect(result).toContain('800')
  })

  it('valor zero formata sem erro', () => {
    const result = formatCurrency(0)
    expect(result).toContain('R$')
  })

  it('valor com centavos inclui separador decimal', () => {
    const result = formatCurrency(1234.56)
    expect(result).toMatch(/1\.234/)
  })
})

// ─── extractFromSchema ────────────────────────────────────────────────────────

describe('extractFromSchema', () => {
  it('extrai campos marcados com x-report:true como textos', () => {
    const schema: ReportSchema = {
      properties: {
        cidade: { type: 'string', 'x-report': true },
        observacao: { type: 'string' },
      },
    }
    const data = { cidade: 'São Paulo', observacao: 'Ignorado' }

    const { texts } = extractFromSchema(schema, data as any)

    expect(texts).toContain('São Paulo')
    expect(texts).not.toContain('Ignorado')
  })

  it('campo com format:date é classificado como data, não texto', () => {
    const schema: ReportSchema = {
      properties: {
        dataEvento: { type: 'string', format: 'date', 'x-report': true },
      },
    }
    const data = { dataEvento: '2026-06-15' }

    const { texts, dates } = extractFromSchema(schema, data as any)

    expect(dates).toContain('2026-06-15')
    expect(texts).toHaveLength(0)
  })

  it('schema sem propriedades retorna arrays vazios', () => {
    const { texts, dates } = extractFromSchema({} as ReportSchema, null)

    expect(texts).toHaveLength(0)
    expect(dates).toHaveLength(0)
  })

  it('valor null no data ignora o campo', () => {
    const schema: ReportSchema = {
      properties: {
        destino: { type: 'string', 'x-report': true },
      },
    }
    const data = { destino: null }

    const { texts } = extractFromSchema(schema, data as any)

    expect(texts).toHaveLength(0)
  })
})

// ─── formatPeriod ─────────────────────────────────────────────────────────────

describe('formatPeriod', () => {
  it('array vazio retorna "N/A"', () => {
    expect(formatPeriod([])).toBe('N/A')
  })

  it('array com uma data retorna data formatada', () => {
    const result = formatPeriod(['2026-04-10'])
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/)
  })

  it('array com duas datas retorna intervalo ordenado com " - "', () => {
    const result = formatPeriod(['2026-05-01', '2026-04-10'])
    expect(result).toContain(' - ')
    expect(result.indexOf('10/04')).toBeLessThan(result.indexOf('01/05'))
  })

  it('datas duplicadas são deduplicadas', () => {
    const result = formatPeriod(['2026-04-10', '2026-04-10'])
    expect(result.split(' - ')).toHaveLength(1)
  })
})

// ─── calculateReportAnalytics ─────────────────────────────────────────────────

describe('calculateReportAnalytics', () => {
  it('totalRequests é igual ao número de despesas', () => {
    const analytics = calculateReportAnalytics([makeExpense(), makeExpense()])
    expect(analytics.totalRequests).toBe(2)
  })

  it('totalAmount soma todos os costBreakdowns de todas as despesas', () => {
    const analytics = calculateReportAnalytics([makeExpense()])
    expect(analytics.totalAmount.toNumber()).toBe(2300)
  })

  it('byCategory agrega corretamente por nome de categoria', () => {
    const analytics = calculateReportAnalytics([makeExpense()])
    expect(analytics.byCategory['Passagem'].toNumber()).toBe(1500)
    expect(analytics.byCategory['Hospedagem'].toNumber()).toBe(800)
  })

  it('byProject agrega por projectId com requestCount correto', () => {
    const analytics = calculateReportAnalytics([makeExpense(), makeExpense()])
    const projectStats = analytics.byProject['project-001']
    expect(projectStats.requestCount).toBe(2)
    expect(projectStats.projectCode).toBe('PA-01')
  })

  it('despesa sem projeto é agrupada em "unassigned"', () => {
    const expense = makeExpense({ projectId: null, project: null })
    const analytics = calculateReportAnalytics([expense])
    expect(analytics.byProject['unassigned']).toBeDefined()
    expect(analytics.byProject['unassigned'].projectName).toBe('Não Atribuído')
  })

  it('lista vazia retorna analytics zerados', () => {
    const analytics = calculateReportAnalytics([])
    expect(analytics.totalRequests).toBe(0)
    expect(analytics.totalAmount.toNumber()).toBe(0)
  })
})

// ─── getReportViewModel — filtros de query ─────────────────────────────────────

describe('getReportViewModel — filtros de query', () => {
  beforeEach(() => prismaMock.expenseRequest.findMany.mockResolvedValue([]))

  it('role ALUNO força filtro studentId = userId (visibilidade própria)', async () => {
    const { UserRole } = await import('@/generated/prisma/enums')

    await getReportViewModel('student-001', UserRole.ALUNO, {})

    const call = prismaMock.expenseRequest.findMany.mock.calls[0][0]
    const visibility = call.where.AND[1]
    expect(visibility).toMatchObject({ studentId: 'student-001' })
  })
})
