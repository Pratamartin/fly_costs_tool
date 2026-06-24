import type { Job, JobWithMetadata } from 'pg-boss'
import type { Mock } from 'vitest'
import type { GenerateReportJobData, GenerateReportJobOutput } from '@/jobs/generate-report.job'
import { testClient } from 'hono/testing'
import * as status from 'stoker/http-status-codes'
import { afterAll, afterEach, assert, beforeAll, describe, expect, it, vi } from 'vitest'
import { GENERATE_REPORT_JOB_TYPE, REPORT_SSE_EVENTS, REPORT_SSE_STATUS } from '@/constants/expense.report.constant'
import { ID_ALUNO, ID_PROJ_ROBOTICA } from '@/constants/seed.constant'
import { UserRole } from '@/generated/prisma/enums'
import { jobManager } from '@/jobs'
import { createTestApp } from '@/lib/config'
import prisma from '@/lib/orm'
import { expenses } from '@/routes'
import { seedExpenseCategories, seedExpenses, seedPreferenceSurveys, seedProjects, seedUsers } from '@/seeds'
import { getReportViewModel } from '@/services/reports'
import { getAuthHeaders } from '../../util'

vi.mock('@/lib/storage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/storage')>()
  return {
    ...actual,
    isStorageConfigured: vi.fn().mockReturnValue(true),
    uploadStream: vi.fn().mockResolvedValue({
      fileKey: 'reports/mock-file.pdf',
      fileName: 'mock-file.pdf',
    }),
    getSignedDownloadUrl: vi.fn().mockResolvedValue('http://signed.url/report.pdf'),
  }
})

const app = createTestApp(expenses)
const client = testClient(app)

type ReportJobWithMetadata = JobWithMetadata<GenerateReportJobData> & { output: GenerateReportJobOutput | null }

describe('[Expense Reports Flow] Integration Tests', () => {
  let adminHeaders: { Authorization: string }
  let studentHeaders: { Authorization: string }
  const endpoint = client.expenses.reports

  beforeAll(async () => {
    await seedUsers()
    await seedExpenseCategories()
    await seedProjects()
    await seedPreferenceSurveys()
    await seedExpenses()

    adminHeaders = await getAuthHeaders('admin@test.com', 'ADMIN')
    studentHeaders = await getAuthHeaders('aluno@test.com', 'ALUNO')

    await jobManager.start()
  })

  afterEach(async () => {
    jobManager.boss.clearSpies()
    vi.restoreAllMocks()
  })

  afterAll(async () => {
    await jobManager.stop()
    await prisma.preferenceSurveyAnswer.deleteMany()
    await prisma.costBreakdown.deleteMany()
    await prisma.expenseRequest.deleteMany()
    await prisma.preferenceSurvey.deleteMany()
    await prisma.project.deleteMany()
    await prisma.expenseCategory.deleteMany()
    await prisma.user.deleteMany()
  })

  describe('2.2.1 API Ingestão', () => {
    it('deve retornar 202 Accepted, jobId e passar filtros corretamente para o job', async () => {
      const spy = jobManager.boss.getSpy<GenerateReportJobData>(GENERATE_REPORT_JOB_TYPE)
      const query = {
        status: 'APROVADO',
        projectId: ID_PROJ_ROBOTICA,
      } as const

      const res = await endpoint.$get(
        { query },
        { headers: adminHeaders },
      )

      expect(res.status).toBe(status.ACCEPTED)
      assert(res.status === status.ACCEPTED)

      const json = await res.json()
      expect(json).toHaveProperty('jobId')

      const job = await spy.waitForJob(data => data.query.status === query.status, 'created')
      expect(job).toBeDefined()
      assert(job)
      expect(job.data.query.projectId).toBe(query.projectId)
      expect(job.data.role).toBe(UserRole.ADMIN)
    })
  })

  describe('2.2.2 Background Worker', () => {
    it('deve simular a execução do job, gerar PDF e fazer upload', async () => {
      const jobInstance = jobManager.getWorker(GENERATE_REPORT_JOB_TYPE)

      const fakeJobData: GenerateReportJobData = {
        userId: ID_ALUNO,
        role: UserRole.ALUNO,
        query: {},
      }

      const fakeJob = {
        id: 'test-job-id',
        data: fakeJobData,
      } as unknown as Job<GenerateReportJobData>

      const result = await jobInstance.work(fakeJob)

      // Verifica se o resultado é um objeto e contém o fileKey
      expect(result).toBeDefined()
      expect(result).not.toBeInstanceOf(Array)
      expect(result).toHaveProperty('fileKey')
      expect(typeof result.fileKey).toBe('string')
      expect(result.fileKey.length).toBeGreaterThan(0)

      expect(result.fileKey).toBe('reports/mock-file.pdf')
    })
  })

  describe('2.2.3 SSE (Server-Side Events)', () => {
    it('deve monitorar o status e receber o evento final com a URL de download', async () => {
      const jobId = '3659c0bd-34e2-4195-9e4a-f64105904e0a'

      // Mockamos o getJob para retornar concluído imediatamente com tipagem rigorosa
      ;(vi.spyOn(jobManager, 'getJob') as Mock).mockResolvedValue({
        id: jobId,
        state: 'completed',
        data: {
          userId: ID_ALUNO,
          role: UserRole.ALUNO,
          query: {},
        },
        output: { fileKey: 'reports/final-report.pdf' },
      } as unknown as ReportJobWithMetadata)

      const res = await app.request(`/expenses/reports/status/${jobId}`, { headers: studentHeaders })

      expect(res.status).toBe(status.OK)
      expect(res.headers.get('content-type')).toContain('text/event-stream')

      const reader = res.body?.getReader()
      assert(reader)

      const { value } = await reader.read()
      const chunk = new TextDecoder().decode(value)

      expect(chunk).toContain(REPORT_SSE_EVENTS.FINISHED)
      expect(chunk).toContain('http://signed.url/report.pdf')
    })

    it('deve propagar mensagem de erro quando o job falha', async () => {
      const jobId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

      ;(vi.spyOn(jobManager, 'getJob') as Mock).mockResolvedValue({
        id: jobId,
        state: 'failed',
        data: {
          userId: ID_ALUNO,
          role: UserRole.ALUNO,
          query: {},
        },
        output: { message: 'Erro de cota excedida' },
      } as unknown as ReportJobWithMetadata)

      const res = await app.request(`/expenses/reports/status/${jobId}`, { headers: studentHeaders })
      const reader = res.body?.getReader()
      assert(reader)

      const { value } = await reader.read()
      const chunk = new TextDecoder().decode(value)

      expect(chunk).toContain(REPORT_SSE_STATUS.FAILED)
      expect(chunk).toContain('Erro de cota excedida')
    })
  })

  describe('2.3 Segurança e Autorização', () => {
    it('acesso ao Status: Aluno não deve conseguir monitorar job de outro usuário', async () => {
      const jobId = '400e8b62-b32f-40b6-93e1-445cb09f24bc'

      ;(vi.spyOn(jobManager, 'getJob') as Mock).mockResolvedValue({
        id: jobId,
        state: 'active',
        data: {
          userId: 'another-user-uuid',
          role: UserRole.ALUNO,
          query: {},
        },
        output: null,
      } as unknown as ReportJobWithMetadata)

      const res = await app.request(`/expenses/reports/status/${jobId}`, { headers: studentHeaders })

      const reader = res.body?.getReader()
      assert(reader)
      const { value } = await reader.read()
      const chunk = new TextDecoder().decode(value)

      expect(chunk).toContain(REPORT_SSE_STATUS.NOT_FOUND)
    })

    it('visibilidade de Dados: Relatório do Aluno deve conter apenas suas próprias despesas', async () => {
      const viewModel = await getReportViewModel(ID_ALUNO, UserRole.ALUNO, {})

      viewModel.rows.forEach((row) => {
        expect(row.studentName).toBe('Codibentinho')
      })

      const adminViewModel = await getReportViewModel('admin-id', UserRole.ADMIN, {})
      expect(adminViewModel.rows).toBeInstanceOf(Array)
    })

    it('isolamento de Custos: Filtro por projeto deve isolar os custos associados e não incluir de outros projetos no mesmo request', async () => {
      const user = await prisma.user.findFirst({ where: { role: 'ALUNO' } })
      assert(user)
      const categories = await prisma.expenseCategory.findMany()
      const projects = await prisma.project.findMany()
      const projA = projects[0]
      const projB = projects[1]
      assert(projA && projB && categories[0] && categories[1])

      const expense = await prisma.expenseRequest.create({
        data: {
          student: { connect: { id: user.id } },
          title: 'Test Title',
          status: 'CONCLUIDO',
          event: {},
          article: {},
          costBreakdowns: {
            create: [
              {
                amount: 200,
                expenseCategory: { connect: { id: categories[0].id } },
                project: { connect: { id: projA.id } },
              },
              {
                amount: 300,
                expenseCategory: { connect: { id: categories[1].id } },
                project: { connect: { id: projB.id } },
              },
            ],
          },
        },
      })

      const viewModelA = await getReportViewModel('admin-id', UserRole.ADMIN, { projectId: projA.id })

      const row = viewModelA.rows.find(r => r.id === expense.id)
      expect(row).toBeDefined()
      expect(row?.totalDisplay.replace(/\s/g, ' ')).toBe('R$ 200,00')
      expect(row?.breakdown).toHaveLength(1)
      expect(row?.breakdown?.[0]?.projectCode).toBe(projA.code)
      expect(row?.totalRaw.toNumber()).toBe(200)
    })
  })
})
