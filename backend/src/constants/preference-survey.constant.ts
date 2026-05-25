export const PREFERENCE_SURVEY_ERROR_CODES = {
  SURVEY_NOT_FOUND: 'SURVEY_NOT_FOUND',
  INVALID_SURVEY_DATA: 'INVALID_SURVEY_DATA',
} as const

export const PREFERENCE_SURVEY_DOWNLOAD_EXPIRY_SECONDS = 900 // 15 minutos

export const PREFERENCE_SURVEY_UPLOAD_MAX_SIZE_MB = 10

export const PREFERENCE_SURVEY_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
] as const
