import { createRoute, z } from '@hono/zod-openapi'
import * as codes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { createMessageObjectSchema } from 'stoker/openapi/schemas'
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
  summary: 'Register user',
  description: 'Registers a new user in the system. The required payload varies by role: Students must provide complete profile data. Coordinators and Admins require only basic credentials.',
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
  summary: 'Authenticate user',
  description: 'Login user into the system.',
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
  summary: 'Refresh access token',
  description: 'Issues a new access token using a valid refresh token from cookies.',
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
      content: { 'application/json': { schema: createMessageObjectSchema('Logged out successfully.') } },
    },
    ...registryResponses('UNAUTHORIZED'),
  },
})

export const forgotPassword = createRoute({
  path: '/forgot-password',
  method: 'post',
  summary: 'Request password reset',
  description: 'Sends an email with password recovery instructions.',
  tags,
  request: { body: jsonContentRequired(ForgotPasswordSchema, 'User email') },
  responses: {
    [codes.OK]: jsonContent(
      createMessageObjectSchema('If the email is registered, you will receive instructions to reset your password.'),
      'Generic success response to prevent user enumeration.',
    ),
    ...registryResponses('VALIDATION_ERROR'),
  },
})

export const resetPassword = createRoute({
  path: '/reset-password',
  method: 'post',
  summary: 'Reset password',
  description: 'Resets user password using a valid token.',
  tags,
  request: { body: jsonContentRequired(ResetPasswordSchema, 'New password and token') },
  responses: {
    [codes.OK]: jsonContent(
      createMessageObjectSchema('Password reset successfully.'),
      'Password changed successfully.',
    ),
    ...registryResponses('INVALID_TOKEN', 'VALIDATION_ERROR'),
  },
})
