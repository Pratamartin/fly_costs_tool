import type { UserRole } from '@/generated/prisma/enums'
import { createRoute, z } from '@hono/zod-openapi'
import * as codes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { createMessageObjectSchema } from 'stoker/openapi/schemas'
import { requireAuth, requireRole } from '@/middlewares'
import { CreateExpenseSchema, CreateExpenseSuccessSchema, ExpenseListQuerySchema, ListExpenseSuccessSchema, UpdateExpenseStatusSchema } from '@/schemas/expense.schema'
import { IdSchema } from '@/schemas/shared.schema'

const tags = ['Expenses']

export type CreateRoute = typeof create
export type IndexRoute = typeof index
export type ReadRoute = typeof read
export type UpdateStatusRoute = typeof updateStatus

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
    [codes.OK]: jsonContent(ListExpenseSuccessSchema, 'Lista de solicitações de despesas.'),
    [codes.UNAUTHORIZED]: jsonContent(createMessageObjectSchema('Não autenticado'), 'Erro: Token inválido ou ausente'),
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
      CreateExpenseSuccessSchema,
      'Solicitação criada com sucesso.',
    ),
    [codes.UNAUTHORIZED]: jsonContent(
      createMessageObjectSchema('Não autenticado'),
      'Token ausente ou inválido.',
    ),
    [codes.FORBIDDEN]: jsonContent(
      createMessageObjectSchema(`Acesso restrito a ${ALLOWED_ROLES.join('/')}`),
      'O usuário não possui a role necessária.',
    ),
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
    [codes.OK]: jsonContent(CreateExpenseSuccessSchema, 'Detalhes da solicitação de despesa.'),
    [codes.NOT_FOUND]: jsonContent(
      createMessageObjectSchema('Despesa não encontrada'),
      'A despesa não existe ou o usuário não tem permissão para visualizá-la.',
    ),
    [codes.UNAUTHORIZED]: jsonContent(
      createMessageObjectSchema('Não autenticado'),
      'Token ausente ou inválido.',
    ),
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
      CreateExpenseSuccessSchema,
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
    [codes.UNAUTHORIZED]: jsonContent(
      createMessageObjectSchema('Não autenticado'),
      'Token ausente ou inválido.',
    ),
    [codes.FORBIDDEN]: jsonContent(
      createMessageObjectSchema(`Acesso restrito a ${EVALUATOR_ROLES.join('/')}`),
      'O usuário não possui a role necessária.',
    ),
  },
})
