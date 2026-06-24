import { createRoute, z } from '@hono/zod-openapi'
import * as codes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { createMessageObjectSchema } from 'stoker/openapi/schemas'
import { PASSWORD_RESET_TOKEN_EXPIRES_IN_HOURS } from '@/constants/auth.constant'
import env from '@/env'
import { registryResponses } from '@/lib/problems'
import { ForgotPasswordSchema, LoginSchema, LoginSuccessSchema, RegisterSchema, RegisterSuccessSchema, ResetPasswordSchema } from '@/schemas/auth.schema'

const tags = ['Auth']

export type RegisterRoute = typeof register
export type LoginRoute = typeof login
export type ForgotPasswordRoute = typeof forgotPassword
export type ResetPasswordRoute = typeof resetPassword
export type RefreshRoute = typeof refresh
export type LogoutRoute = typeof logout

export const register = createRoute({
  path: '/register',
  method: 'post',
  operationId: 'registerUser',
  summary: 'Register a new user',
  description: 'Creates a new user account. Role-specific constraints apply: Students (`ALUNO`) must provide full banking and identity profiles, whereas Staff (`ADMIN`, `COORDENADOR`) only require basic credentials. Requires a valid, unexpired invite code.',
  tags,
  request: { body: jsonContentRequired(RegisterSchema, 'User credentials') },
  responses: {
    [codes.CREATED]: jsonContent(
      RegisterSuccessSchema,
      'User created successfully',
    ),
    ...registryResponses('EMAIL_ALREADY_EXISTS', 'INVITE_NOT_FOUND', 'INVITE_ALREADY_USED', 'INVITE_ALREADY_EXPIRED', 'VALIDATION_ERROR'),
  },
})

export const login = createRoute({
  path: '/login',
  method: 'post',
  operationId: 'loginUser',
  summary: 'Authenticate user',
  description: `Authenticates a user using email and password. On success, returns a short-lived JWT access token in the response body, and sets a long-lived refresh token in an \`HttpOnly\` cookie (expires in **${env.REFRESH_TOKEN_EXPIRES_DAYS} days**).`,
  tags,
  request: { body: jsonContentRequired(LoginSchema, 'User credentials') },
  responses: {
    [codes.OK]: {
      content: { 'application/json': { schema: LoginSuccessSchema } },
      description: 'Authentication successful. The access token is returned in the response body, and a refresh token is set in an httpOnly cookie.',
      headers: z.object({
        'Set-Cookie': z.string().openapi({
          description: 'The refresh token in an httpOnly cookie.',
          example: 'refreshToken=...; HttpOnly; SameSite=Lax',
        }),
      }),
    },
    ...registryResponses('UNAUTHORIZED', 'VALIDATION_ERROR'),
  },
})

export const refresh = createRoute({
  path: '/refresh',
  method: 'post',
  operationId: 'refreshToken',
  summary: 'Refresh access token',
  description: 'Issues a new JWT access token using a valid refresh token from cookies.',
  tags,
  request: {},
  responses: {
    [codes.OK]: jsonContent(
      LoginSuccessSchema,
      'New access token issued.',
    ),
    ...registryResponses('UNAUTHORIZED'),
  },
})

export const logout = createRoute({
  path: '/logout',
  method: 'post',
  operationId: 'logoutUser',
  summary: 'Logout user',
  description: 'Invalidates the current session and clears the refresh token cookie.',
  tags,
  request: {},
  responses: {
    [codes.OK]: {
      description: 'User logged out successfully.',
      headers: z.object({
        'Set-Cookie': z.string().openapi({
          description: 'Clears the refresh token cookie.',
          example: 'refreshToken=; Max-Age=0; Path=/; HttpOnly',
        }),
      }),
      content: { 'application/json': { schema: createMessageObjectSchema('Logged out successfully.').openapi('LogoutResponse') } },
    },
    ...registryResponses('UNAUTHORIZED'),
  },
})

export const forgotPassword = createRoute({
  path: '/forgot-password',
  method: 'post',
  operationId: 'forgotPassword',
  summary: 'Request password reset',
  description: `Initiates the password recovery flow. To prevent user enumeration attacks, this endpoint always returns a 200 OK success message regardless of whether the email is registered or active. If valid, an email with a secure reset token (valid for **${PASSWORD_RESET_TOKEN_EXPIRES_IN_HOURS} hour(s)**) is dispatched asynchronously via job queue.`,
  tags,
  request: { body: jsonContentRequired(ForgotPasswordSchema, 'User email') },
  responses: {
    [codes.OK]: jsonContent(
      createMessageObjectSchema('If the email is registered, you will receive instructions to reset your password.').openapi('ForgotPasswordResponse'),
      'Generic success response to prevent user enumeration.',
    ),
    ...registryResponses('VALIDATION_ERROR'),
  },
})

export const resetPassword = createRoute({
  path: '/reset-password',
  method: 'post',
  operationId: 'resetPassword',
  summary: 'Reset password',
  description: `Resets user password using a valid token. The token must match the SHA-256 hash stored in the database and must not be expired (token lifespan: **${PASSWORD_RESET_TOKEN_EXPIRES_IN_HOURS} hour(s)**).`,
  tags,
  request: { body: jsonContentRequired(ResetPasswordSchema, 'New password and token') },
  responses: {
    [codes.OK]: jsonContent(
      createMessageObjectSchema('Password reset successfully.').openapi('ResetPasswordResponse'),
      'Password changed successfully.',
    ),
    ...registryResponses('INVALID_TOKEN', 'VALIDATION_ERROR'),
  },
})
