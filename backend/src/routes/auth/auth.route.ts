import { createRoute } from '@hono/zod-openapi'
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
    ...registryResponses('EMAIL_ALREADY_EXISTS', 'INVALID_INVITE_CODE', 'VALIDATION_ERROR'),
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
    [codes.OK]: jsonContent(
      LoginSuccessSchema,
      'Authentication successful. The access token is returned in the response body.',
    ),
    ...registryResponses('UNAUTHORIZED', 'VALIDATION_ERROR'),
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
