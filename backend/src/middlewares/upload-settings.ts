import { bodyLimit } from 'hono/body-limit'
import { createMiddleware } from 'hono/factory'

import { ZodIssueCode } from 'zod'
import { ALLOWED_RECEIPT_MIME_TYPES, RECEIPT_UPLOAD_MAX_SIZE_MB } from '@/constants/file.constant'
import { PREFERENCE_SURVEY_ALLOWED_MIME_TYPES, PREFERENCE_SURVEY_UPLOAD_MAX_SIZE_MB } from '@/constants/preference-survey.constant'
import { problems } from '@/lib/problems'

export type UploadOptions = {
  maxFileSizeMB: number
  allowedMimeFileTypes: readonly string[]
  fieldName?: string
}

export default function uploadSettings(options: UploadOptions) {
  const fieldName = options.fieldName ?? 'files'

  const size = bodyLimit({
    maxSize: options.maxFileSizeMB * 1024 * 1024,
    onError: (_c) => {
      throw problems.create('FILE_TOO_LARGE', {
        detail: `The total request size exceeds the limit of ${options.maxFileSizeMB}MB.`,
        extensions: { maxSizeMB: options.maxFileSizeMB },
      })
    },
  })

  const content = createMiddleware(async (c, next) => {
    const body = await c.req.parseBody({ all: true })
    const data = body[fieldName]

    if (!data) {
      throw problems.create('VALIDATION_ERROR', {
        detail: `The field '${fieldName}' is required.`,
        extensions: {
          errors: [{
            field: fieldName,
            message: 'Required',
            code: ZodIssueCode.invalid_type,
          }],
        },
      })
    }

    const files = Array.isArray(data) ? data : [data]

    for (const file of files) {
      if (!(file instanceof File)) {
        throw problems.create('INVALID_FILE', { detail: `The field '${fieldName}' must contain files only.` })
      }

      if (!options.allowedMimeFileTypes.includes(file.type)) {
        throw problems.create('UNSUPPORTED_MEDIA_TYPE', {
          detail: `The file format '${file.type}' is not supported for field '${fieldName}'.`,
          extensions: { allowedMimeTypes: [...options.allowedMimeFileTypes] },
        })
      }
    }

    await next()
  })

  return {
    size,
    content,
  }
}

export const uploadMemorandumSettings = uploadSettings({
  maxFileSizeMB: 5,
  allowedMimeFileTypes: ['application/pdf'],
  fieldName: 'file',
})

export const uploadReceiptSettings = uploadSettings({
  maxFileSizeMB: RECEIPT_UPLOAD_MAX_SIZE_MB,
  allowedMimeFileTypes: ALLOWED_RECEIPT_MIME_TYPES,
  fieldName: 'file',
})

export const uploadSurveySettings = uploadSettings({
  maxFileSizeMB: PREFERENCE_SURVEY_UPLOAD_MAX_SIZE_MB,
  allowedMimeFileTypes: PREFERENCE_SURVEY_ALLOWED_MIME_TYPES,
  fieldName: 'file',
})
