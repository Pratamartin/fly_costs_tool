import type { UserRole } from '@/generated/prisma/enums'
import { createRoute, z } from '@hono/zod-openapi'
import * as codes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { createMessageObjectSchema } from 'stoker/openapi/schemas'
import { requireAuth, requireRole } from '@/middlewares'
import { CreateExpenseSchema, CreateExpenseSuccessSchema, ListExpenseSuccessSchema } from '@/schemas/expense.schema'
import { IdSchema } from '@/schemas/shared.schema'

const tags = ['Expenses']

export type CreateRoute = typeof create
export type IndexRoute = typeof index
export type ReadRoute = typeof read

const ALLOWED_ROLES: UserRole[] = ['ALUNO']

export const index = createRoute({
  path: '/',
  method: 'get',
  middleware: [requireAuth],
  security: [{ bearerAuth: [] }],
  summary: 'List expenses',
  description: 'Retorna todas as despesas se for ADMIN/COORDENADOR ou apenas as próprias se for ALUNO.',
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
