import { createRoute, z } from '@hono/zod-openapi'
import * as codes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { createMessageObjectSchema } from 'stoker/openapi/schemas'
import { UserRole } from '@/generated/prisma/enums'
import { multipartFormContentRequired } from '@/lib/util'
import { requireAuth, requireRole } from '@/middlewares'
import { uploadMemorandumSettings } from '@/middlewares/upload-settings'
import { CostBreakdownResponseSchema, CreateCostBreakdownSchema } from '@/schemas/cost-breakdown.schema'
import { AssignProjectResponseSchema, CreateExpenseResponseSchema, CreateExpenseSchema, ExpenseListQuerySchema, ExpenseResponseSchema, ListExpenseResponseSchema, UpdateExpenseStatusSchema, UploadMemorandumSchema } from '@/schemas/expense.schema'
import { ForbiddenResponse, IdSchema, UnauthorizedResponse } from '@/schemas/shared.schema'

const tags = ['Expenses']

export type CreateRoute = typeof create
export type IndexRoute = typeof index
export type ReadRoute = typeof read
export type UpdateStatusRoute = typeof updateStatus
export type AssignProjectRoute = typeof assignProject
export type CreateCostBreakdownRoute = typeof createCostBreakdown
export type UploadMemorandumRoute = typeof uploadMemorandum
export type GetMemorandumDownloadRoute = typeof getMemorandumDownload

const ALLOWED_ROLES: UserRole[] = ['ALUNO']

export const index = createRoute({
  path: '/',
  method: 'get',
  middleware: [requireAuth],
  security: [{ bearerAuth: [] }],
  summary: 'List expenses',
  description: 'Retorna todas as despesas se for ADMIN/COORDENADOR ou apenas as próprias se for ALUNO.',
  request: { query: ExpenseListQuerySchema },
  tags,
  responses: {
    [codes.OK]: jsonContent(ListExpenseResponseSchema, 'Lista de solicitações de despesas.'),
    [codes.UNAUTHORIZED]: UnauthorizedResponse,
  },
})

export const create = createRoute({
  path: '/',
  method: 'post',
  middleware: [requireAuth, requireRole(ALLOWED_ROLES)],
  security: [{ bearerAuth: [] }],
  summary: 'Create expense request',
  description: `
    Permite que um aluno do PPGI solicite uma nova ajuda de custo.
    Restrito a usuários com perfil: ${ALLOWED_ROLES.join(', ')}.
  `,
  tags,
  request: { body: jsonContentRequired(CreateExpenseSchema, 'Dados da solicitação') },
  responses: {
    [codes.CREATED]: jsonContent(
      CreateExpenseResponseSchema,
      'Solicitação criada com sucesso.',
    ),
    [codes.UNAUTHORIZED]: UnauthorizedResponse,
    [codes.FORBIDDEN]: ForbiddenResponse,
  },
})

export const read = createRoute({
  path: '/{id}',
  method: 'get',
  middleware: [requireAuth],
  security: [{ bearerAuth: [] }],
  summary: 'Get expense by ID',
  description: 'Retorna os detalhes de uma solicitação de despesa. Alunos só podem acessar suas próprias solicitações.',
  tags,
  request: { params: z.object({ id: IdSchema }) },
  responses: {
    [codes.OK]: jsonContent(ExpenseResponseSchema, 'Detalhes da solicitação de despesa.'),
    [codes.NOT_FOUND]: jsonContent(
      createMessageObjectSchema('Despesa não encontrada'),
      'A despesa não existe ou o usuário não tem permissão para visualizá-la.',
    ),
    [codes.UNAUTHORIZED]: UnauthorizedResponse,
  },
})

const EVALUATOR_ROLES: UserRole[] = ['COORDENADOR', 'ADMIN']
export const updateStatus = createRoute({
  path: '/{id}/status',
  method: 'patch',
  middleware: [requireAuth, requireRole(EVALUATOR_ROLES)],
  security: [{ bearerAuth: [] }],
  summary: 'Update expense status',
  description: `
    Permite atualizar o status de uma despesa existente.
    Restrito a usuários com perfil: ${EVALUATOR_ROLES.join(', ')}.
  `,
  tags,
  request: {
    params: z.object({ id: IdSchema }),
    body: jsonContentRequired(UpdateExpenseStatusSchema, 'Novo status da solicitação'),
  },
  responses: {
    [codes.OK]: jsonContent(
      ExpenseResponseSchema,
      'Status atualizado com sucesso.',
    ),
    [codes.NOT_FOUND]: jsonContent(
      createMessageObjectSchema('Despesa não encontrada'),
      'Nenhuma solicitação encontrada com o ID fornecido.',
    ),
    [codes.CONFLICT]: jsonContent(
      createMessageObjectSchema('Solicitação já foi decidida'),
      'A despesa não está mais pendente e não pode ter seu status alterado.',
    ),
    [codes.UNAUTHORIZED]: UnauthorizedResponse,
    [codes.FORBIDDEN]: ForbiddenResponse,
  },
})

export const assignProject = createRoute({
  path: '/{id}/assign-project',
  method: 'patch',
  middleware: [requireAuth, requireRole([UserRole.ADMIN])],
  security: [{ bearerAuth: [] }],
  summary: 'Assign Project to Expense',
  description: `
    Vincula um projeto específico a uma solicitação de despesa previamente aprovada. 
    A operação valida se o projeto possui saldo disponível, associa o projeto à solicitação e transiciona o status da despesa para 'EM_PROCESSAMENTO'.
    Acesso restrito ao perfil: ADMIN.
  `,
  tags,
  request: {
    params: z.object({ id: IdSchema }),
    body: jsonContent(
      z.object({ projectId: IdSchema }),
      'ID do projeto a ser vinculado',
    ),
  },
  responses: {
    [codes.OK]: jsonContent(
      AssignProjectResponseSchema,
      'Projeto vinculado e status alterado para EM_PROCESSAMENTO.',
    ),
    [codes.NOT_FOUND]: jsonContent(
      createMessageObjectSchema('Recurso não encontrado'),
      'Solicitação ou Projeto não encontrados.',
    ),
    [codes.CONFLICT]: jsonContent(
      createMessageObjectSchema('Operação inválida'),
      'A solicitação não está com status APROVADO, o projeto está arquivado ou o projeto não possui budget suficiente.',
    ),
    [codes.UNAUTHORIZED]: UnauthorizedResponse,
    [codes.FORBIDDEN]: ForbiddenResponse,
  },
})

export const createCostBreakdown = createRoute({
  path: '/{id}/cost-breakdown',
  method: 'post',
  middleware: [requireAuth, requireRole([UserRole.ADMIN])],
  security: [{ bearerAuth: [] }],
  summary: 'Add cost breakdown to expense',
  description: 'Adiciona uma discriminação de custo a uma solicitação de despesa. Restrito a ADMIN.',
  tags,
  request: {
    params: z.object({ id: IdSchema }),
    body: jsonContentRequired(CreateCostBreakdownSchema, 'Detalhes da discriminação de custo'),
  },
  responses: {
    [codes.CREATED]: jsonContent(
      CostBreakdownResponseSchema,
      'Discriminação salva com sucesso.',
    ),
    [codes.BAD_REQUEST]: jsonContent(
      createMessageObjectSchema('Erro de validação'),
      'Erro de regra de negócio (ex: Budget insuficiente, Categoria inválida).',
    ),
    [codes.CONFLICT]: jsonContent(
      createMessageObjectSchema('Operação inválida'),
      'O projeto está arquivado ou não pode receber discriminação de custo.',
    ),
    [codes.NOT_FOUND]: jsonContent(
      createMessageObjectSchema('Despesa não encontrada'),
      'A despesa não existe ou não possui projeto vinculado.',
    ),
    [codes.UNAUTHORIZED]: UnauthorizedResponse,
    [codes.FORBIDDEN]: ForbiddenResponse,
  },
})

export const uploadMemorandum = createRoute({
  path: '/{id}/memorandum',
  method: 'post',
  middleware: [requireAuth, requireRole(ALLOWED_ROLES), uploadMemorandumSettings.size, uploadMemorandumSettings.content],
  security: [{ bearerAuth: [] }],
  summary: 'Upload memorando (PDF)',
  description:
    'Aluno anexa PDF à solicitação **PENDENTE**. Envie `multipart/form-data` com campo **file**.',
  tags,
  request: {
    params: z.object({ id: IdSchema }),
    body: multipartFormContentRequired(UploadMemorandumSchema, 'Upload do arquivo PDF do memorando'),
  },
  responses: {
    [codes.OK]: jsonContent(
      ExpenseResponseSchema,
      'Memorando anexado; despesa atualizada.',
    ),
    [codes.BAD_REQUEST]: jsonContent(
      createMessageObjectSchema('Arquivo inválido'),
      'PDF ausente, inválido ou solicitação sem memorando.',
    ),
    [codes.FORBIDDEN]: jsonContent(
      createMessageObjectSchema('Sem permissão'),
      'Somente o aluno dono pode anexar.',
    ),
    [codes.CONFLICT]: jsonContent(
      createMessageObjectSchema('Estado inválido'),
      'Só é possível anexar em solicitação pendente.',
    ),
    [codes.NOT_FOUND]: jsonContent(
      createMessageObjectSchema('Despesa não encontrada'),
      'ID inválido.',
    ),
    [codes.SERVICE_UNAVAILABLE]: jsonContent(
      createMessageObjectSchema('Armazenamento indisponível'),
      'Variáveis R2 não configuradas.',
    ),
    [codes.UNAUTHORIZED]: UnauthorizedResponse,
  },
})

export const getMemorandumDownload = createRoute({
  path: '/{id}/memorandum/download',
  method: 'get',
  middleware: [requireAuth],
  security: [{ bearerAuth: [] }],
  summary: 'URL assinada para download do memorando',
  description:
    'Aluno (próprio), coordenador ou admin obtém URL temporária (1h) para baixar o PDF no R2.',
  tags,
  request: { params: z.object({ id: IdSchema }) },
  responses: {
    [codes.OK]: jsonContent(
      z.object({
        downloadUrl: z.string().url(),
        expiresIn: z.number(),
      }),
      'URL gerada.',
    ),
    [codes.BAD_REQUEST]: jsonContent(
      createMessageObjectSchema('Sem memorando'),
      'Despesa sem anexo.',
    ),
    [codes.FORBIDDEN]: jsonContent(
      createMessageObjectSchema('Sem permissão'),
      'Aluno só acessa a própria solicitação.',
    ),
    [codes.NOT_FOUND]: jsonContent(
      createMessageObjectSchema('Despesa não encontrada'),
      'ID inválido.',
    ),
    [codes.SERVICE_UNAVAILABLE]: jsonContent(
      createMessageObjectSchema('Armazenamento indisponível'),
      'Variáveis R2 não configuradas.',
    ),
    [codes.UNAUTHORIZED]: UnauthorizedResponse,
  },
})
