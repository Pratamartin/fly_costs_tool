import { createRoute } from '@hono/zod-openapi'
import * as codes from 'stoker/http-status-codes'
import { jsonContent } from 'stoker/openapi/helpers'
import { registryResponses, standardResponses } from '@/lib/problems'
import { requireAuth } from '@/middlewares'
import { UpdateProfileSchema, UserSchema } from '@/schemas/user.schema'

const tags = ['Me']

export type IndexRoute = typeof index

export const index = createRoute({
  path: '/',
  method: 'get',
  summary: 'Get current user profile',
  description: 'Returns detailed data for the currently authenticated user.',
  tags,
  middleware: [requireAuth],
  security: [{ Bearer: [] }],
  responses: {
    [codes.OK]: jsonContent(
      UserSchema,
      'User profile retrieved successfully.',
    ),
    ...registryResponses('UNAUTHORIZED', 'USER_NOT_FOUND'),
  },
})

export type UpdateRoute = typeof update

export const update = createRoute({
  path: '/',
  method: 'patch',
  summary: 'Update current user profile',
  description: 'Updates profile information for the authenticated user.',
  tags,
  middleware: [requireAuth],
  security: [{ Bearer: [] }],
  request: { body: jsonContent(UpdateProfileSchema, 'Profile update data') },
  responses: {
    [codes.OK]: jsonContent(
      UserSchema,
      'Profile updated successfully.',
    ),
    ...standardResponses,
    ...registryResponses('CPF_CONFLICT', 'USER_NOT_FOUND', 'PROFILE_NOT_ALLOWED'),
  },
})
