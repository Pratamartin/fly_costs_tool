import { createRoute, z } from '@hono/zod-openapi'
import * as codes from 'stoker/http-status-codes'
import { jsonContent } from 'stoker/openapi/helpers'
import { registryResponses } from '@/lib/problems'
import { requireAuth } from '@/middlewares'
import { uploadSurveySettings } from '@/middlewares/upload-settings'
import { ListPreferenceSurveyResponseSchema } from '@/schemas/preference-survey.schema'

const tags = ['Preference Surveys']

export const listActive = createRoute({
  path: '/',
  method: 'get',
  middleware: [requireAuth],
  security: [{ bearerAuth: [] }],
  summary: 'List active preference surveys',
  description: 'Returns all active preference survey schemas linked to expense categories.',
  tags,
  responses: {
    [codes.OK]: jsonContent(ListPreferenceSurveyResponseSchema, 'List of preference surveys.'),
    ...registryResponses('UNAUTHORIZED'),
  },
})

export const upload = createRoute({
  path: '/upload',
  method: 'post',
  middleware: [
    requireAuth,
    uploadSurveySettings.size,
    uploadSurveySettings.content,
  ] as const,
  security: [{ bearerAuth: [] }],
  summary: 'Upload a file for a preference survey',
  description: 'Uploads a file to R2 storage and returns the file key to be used in the form response.',
  tags,
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: z.object({
            file: z.instanceof(File).openapi({
              type: 'string',
              format: 'binary',
              description: 'File to be uploaded (PDF, JPEG, PNG). Max 10MB.',
            }),
          }),
        },
      },
    },
  },
  responses: {
    [codes.OK]: jsonContent(
      z.object({
        fileKey: z.string().openapi({ description: 'File key in R2' }),
        fileName: z.string().openapi({ description: 'Original file name' }),
      }),
      'File uploaded successfully.',
    ),
    ...registryResponses('INVALID_FILE', 'FILE_TOO_LARGE', 'UNSUPPORTED_MEDIA_TYPE', 'UNAUTHORIZED', 'STORAGE_PROVIDER_ERROR', 'VALIDATION_ERROR'),
  },
})

export const download = createRoute({
  path: '/download',
  method: 'get',
  middleware: [requireAuth],
  security: [{ bearerAuth: [] }],
  summary: 'Signed URL for survey attachment download',
  description: 'Generates a temporary URL to download a file uploaded via a preference survey.',
  tags,
  request: { query: z.object({ fileKey: z.string().openapi({ description: 'File key in R2' }) }) },
  responses: {
    [codes.OK]: jsonContent(
      z.object({
        downloadUrl: z.string().url(),
        expiresIn: z.number(),
      }),
      'URL generated successfully.',
    ),
    ...registryResponses('INVALID_FILE', 'UNAUTHORIZED', 'STORAGE_UNAVAILABLE', 'VALIDATION_ERROR'),
  },
})

export type ListActiveRoute = typeof listActive
export type UploadRoute = typeof upload
export type DownloadRoute = typeof download
