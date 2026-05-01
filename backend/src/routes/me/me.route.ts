import { createRoute } from '@hono/zod-openapi'
import * as codes from 'stoker/http-status-codes'
import { jsonContent } from 'stoker/openapi/helpers'
import { createMessageObjectSchema } from 'stoker/openapi/schemas'
import { requireAuth } from '@/middlewares'
import { UnauthorizedResponse } from '@/schemas/shared.schema'
import { UserProfileSchema } from '@/schemas/user.schema'

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
      UserProfileSchema,
      'Perfil do usuário retornado com sucesso.',
    ),
    [codes.UNAUTHORIZED]: UnauthorizedResponse,
    [codes.NOT_FOUND]: jsonContent(
      createMessageObjectSchema('Usuário não encontrado'),
      'Erro: O usuário correspondente ao token não existe mais no banco de dados.',
    ),
  },
})
