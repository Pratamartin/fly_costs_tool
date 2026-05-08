import { createRoute } from '@hono/zod-openapi'
import * as codes from 'stoker/http-status-codes'
import { jsonContent } from 'stoker/openapi/helpers'
import { createMessageObjectSchema } from 'stoker/openapi/schemas'
import { requireAuth } from '@/middlewares'
import { UnauthorizedResponse } from '@/schemas/shared.schema'
import { UpdateProfileSchema, UserSchema } from '@/schemas/user.schema'

const tags = ['Me']

export type IndexRoute = typeof index

export const index = createRoute({
  path: '/',
  method: 'get',
  summary: 'Get current user profile',
  description: 'Retorna os dados detalhados do usuário atualmente autenticado.',
  tags,
  middleware: [requireAuth],
  security: [{ Bearer: [] }],
  responses: {
    [codes.OK]: jsonContent(
      UserSchema,
      'Perfil do usuário retornado com sucesso.',
    ),
    [codes.UNAUTHORIZED]: UnauthorizedResponse,
    [codes.NOT_FOUND]: jsonContent(
      createMessageObjectSchema('Usuário não encontrado'),
      'Erro: O usuário correspondente ao token não existe mais no banco de dados.',
    ),
  },
})

export type UpdateRoute = typeof update

export const update = createRoute({
  path: '/',
  method: 'patch',
  summary: 'Update current user profile',
  description: 'Atualiza os dados do perfil do usuário autenticado.',
  tags,
  middleware: [requireAuth],
  security: [{ Bearer: [] }],
  request: { body: jsonContent(UpdateProfileSchema, 'Dados do perfil para atualização') },
  responses: {
    [codes.OK]: jsonContent(
      UserSchema,
      'Perfil atualizado com sucesso.',
    ),
    [codes.UNAUTHORIZED]: UnauthorizedResponse,
    [codes.FORBIDDEN]: jsonContent(
      createMessageObjectSchema('Acesso negado'),
      'Apenas alunos podem atualizar dados de perfil.',
    ),
    [codes.CONFLICT]: jsonContent(
      createMessageObjectSchema('Conflito de CPF'),
      'O CPF informado já está em uso por outro usuário.',
    ),
    [codes.NOT_FOUND]: jsonContent(
      createMessageObjectSchema('Usuário não encontrado'),
      'O usuário não foi encontrado no sistema.',
    ),
  },
})
