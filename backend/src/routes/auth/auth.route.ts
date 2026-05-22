import { createRoute } from '@hono/zod-openapi'
import * as codes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { createMessageObjectSchema } from 'stoker/openapi/schemas'
import { ForgotPasswordSchema, LoginSchema, LoginSuccessSchema, RegisterSchema, RegisterSuccessSchema, ResetPasswordSchema } from '@/schemas/auth.schema'
import { UnauthorizedResponse } from '@/schemas/shared.schema'

const tags = ['Auth']

export type RegisterRoute = typeof register
export type LoginRoute = typeof login
export type ForgotPasswordRoute = typeof forgotPassword
export type ResetPasswordRoute = typeof resetPassword

export const register = createRoute({
  path: '/register',
  method: 'post',
  summary: 'Register user',
  description: 'Registra um novo usuário no sistema. O payload exigido varia de acordo com o papel: Alunos devem enviar dados de perfil completos. Coordenadores e Admins exigem apenas credenciais básicas.',
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

export const forgotPassword = createRoute({
  path: '/forgot-password',
  method: 'post',
  summary: 'Request password reset',
  description: 'Envia um e-mail com instruções para recuperação de senha.',
  tags,
  request: { body: jsonContentRequired(ForgotPasswordSchema, 'User email') },
  responses: {
    [codes.OK]: jsonContent(
      createMessageObjectSchema('Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.'),
      'Sucesso genérico para evitar enumeração de usuários.',
    ),
  },
})

export const resetPassword = createRoute({
  path: '/reset-password',
  method: 'post',
  summary: 'Reset password',
  description: 'Redefine a senha do usuário utilizando um token válido.',
  tags,
  request: { body: jsonContentRequired(ResetPasswordSchema, 'New password and token') },
  responses: {
    [codes.OK]: jsonContent(
      createMessageObjectSchema('Senha redefinida com sucesso.'),
      'Senha alterada com sucesso.',
    ),
    [codes.BAD_REQUEST]: jsonContent(
      createMessageObjectSchema('Token inválido ou expirado.'),
      'Erro na redefinição de senha.',
    ),
  },
})
