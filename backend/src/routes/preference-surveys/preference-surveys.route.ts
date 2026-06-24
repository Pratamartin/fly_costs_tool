import { createRoute, z } from '@hono/zod-openapi'
import * as codes from 'stoker/http-status-codes'
import { jsonContent } from 'stoker/openapi/helpers'
import { PREFERENCE_SURVEY_ALLOWED_MIME_TYPES, PREFERENCE_SURVEY_DOWNLOAD_EXPIRY_SECONDS, PREFERENCE_SURVEY_UPLOAD_MAX_SIZE_MB } from '@/constants/preference-survey.constant'
import { registryResponses } from '@/lib/problems'
import { requireAuth } from '@/middlewares'
import { uploadSurveySettings } from '@/middlewares/upload-settings'
import { ListPreferenceSurveyResponseSchema } from '@/schemas/preference-survey.schema'
import { FileDownloadResponseSchema } from '@/schemas/shared.schema'

const tags = ['Preference Surveys']

export const listActive = createRoute({
  path: '/',
  method: 'get',
  middleware: [requireAuth],
  security: [{ bearerAuth: [] }],
  operationId: 'listActivePreferenceSurveys',
  summary: 'List active surveys',
  description: 'Returns all active preference survey JSON schemas (AJV rules) linked to expense categories. The frontend uses these to dynamically render expense forms.',
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
  operationId: 'uploadPreferenceSurveyFile',
  summary: 'Upload survey file',
  description: `Uploads a file to R2 cloud storage and returns a \`fileKey\`. This key must be sent later in the JSON payload of the actual survey submission. Supported formats: **${PREFERENCE_SURVEY_ALLOWED_MIME_TYPES.join(', ')}**. Max size: **${PREFERENCE_SURVEY_UPLOAD_MAX_SIZE_MB}MB**.`,
  tags,
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: z.object({
            file: z.instanceof(File).openapi({
              type: 'string',
              format: 'binary',
              description: `File to be uploaded. Allowed formats: ${PREFERENCE_SURVEY_ALLOWED_MIME_TYPES.join(', ')}. Max ${PREFERENCE_SURVEY_UPLOAD_MAX_SIZE_MB}MB.`,
            })
              .openapi('UploadSurveyRequest'),
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
      }).openapi('UploadSurveyResponse'),
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
  operationId: 'getPreferenceSurveyDownloadUrl',
  summary: 'Get download URL',
  description: `Generates a signed, temporary S3/R2 URL to securely download a previously uploaded preference survey file using its \`fileKey\`. URL expires in **${PREFERENCE_SURVEY_DOWNLOAD_EXPIRY_SECONDS}s**.`,
  tags,
  request: { query: z.object({ fileKey: z.string().openapi({ description: 'File key in R2' }) }).openapi('DownloadSurveyQuery') },
  responses: {
    [codes.OK]: jsonContent(
      FileDownloadResponseSchema,
      'URL generated successfully.',
    ),
    ...registryResponses('INVALID_FILE', 'UNAUTHORIZED', 'STORAGE_UNAVAILABLE', 'VALIDATION_ERROR'),
  },
})

export type ListActiveRoute = typeof listActive
export type UploadRoute = typeof upload
export type DownloadRoute = typeof download
