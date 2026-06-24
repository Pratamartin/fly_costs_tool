export const GENERATE_REPORT_JOB_TYPE = 'generate-expense-report' as const

export const REPORT_JOB_OPTIONS = {
  retryLimit: 2,
  retryDelay: 30,
} as const

export const REPORT_SSE_EVENTS = {
  UPDATE: 'report-update',
  FINISHED: 'report-finished',
  ERROR: 'report-error',
} as const

export const REPORT_SSE_STATUS = {
  NOT_FOUND: 'not_found',
  COMPLETED: 'completed',
  ERROR: 'error',
  FAILED: 'failed',
} as const

export const REPORT_TRANSLATIONS = {
  from: 'Data Inicial',
  to: 'Data Final',
  status: 'Status',
  projectId: 'Projeto',
  studentId: 'Aluno',
} as const

export const REPORT_PDF_CONFIG = {
  MAX_RECORDS: 2000,
  PAGE_ORIENTATION: 'landscape' as const,
  CURRENCY: 'BRL',
  LOCALE: 'pt-BR',
  DATE_FORMAT: 'DD/MM/YYYY HH:mm',
  FILTER_DATE_FORMAT: 'DD/MM/YYYY',
  COLORS: {
    SUBHEADER: '#666666',
    TABLE_HEADER_FILL: '#f3f4f6',
  },
} as const
