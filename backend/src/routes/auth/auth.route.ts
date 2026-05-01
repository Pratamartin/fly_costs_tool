import { createRoute } from '@hono/zod-openapi'
import * as codes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { createMessageObjectSchema } from 'stoker/openapi/schemas'
import { LoginSchema, LoginSuccessSchema, RegisterSchema, RegisterSuccessSchema } from '@/schemas/auth.schema'
import { UnauthorizedResponse } from '@/schemas/shared.schema'

const tags = ['Auth']

export type RegisterRoute = typeof register
export type LoginRoute = typeof login

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

export const login = createRoute({
  path: '/login',
  method: 'post',
  summary: 'Authenticate user',
  description: 'Logar usuário no sistema.',
  tags,
  request: { body: jsonContentRequired(LoginSchema, 'User credentials') },
  responses: {
    [codes.OK]: jsonContent(
      LoginSuccessSchema,
      'Autenticação bem-sucedida. O access token é retornado no corpo da resposta.',
    ),
    [codes.UNAUTHORIZED]: UnauthorizedResponse,
  },
})
