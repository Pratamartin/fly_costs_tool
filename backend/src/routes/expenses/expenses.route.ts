import type { UserRole } from '@/generated/prisma/enums'
import { createRoute } from '@hono/zod-openapi'
import * as codes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { createMessageObjectSchema } from 'stoker/openapi/schemas'
import { requireAuth, requireRole } from '@/middlewares'
import { CreateExpenseSchema, CreateExpenseSuccessSchema, ListExpenseSuccessSchema } from '@/schemas/expense.schema'

const tags = ['Expenses']

export type CreateRoute = typeof create
export type IndexRoute = typeof index

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
