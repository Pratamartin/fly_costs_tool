import { createRoute } from '@hono/zod-openapi'
import * as codes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { createMessageObjectSchema } from 'stoker/openapi/schemas'
import { RegisterSchema, RegisterSuccessSchema } from '@/schemas/auth.schema'

const tags = ['Auth']

export const register = createRoute({
  path: '/register',
  method: 'post',
  summary: 'Register user',
  description: 'Registrar um novo usuário no sistema.',
  tags,
  request: { body: jsonContentRequired(RegisterSchema, 'User credentials') },
  responses: {
    [codes.CREATED]: jsonContent(
      RegisterSuccessSchema,
      'Usuário criado com sucesso',
    ),

    [codes.CONFLICT]: jsonContent(
      createMessageObjectSchema('E-mail já cadastrado'),
      'Erro: Conflito de dados',
    ),

    [codes.BAD_REQUEST]: jsonContent(
      createMessageObjectSchema('Código de convite inválido'),
      'Erro: O código de convite fornecido não é válido ou expirou.',
    ),
  },
})

export type RegisterRoute = typeof register
