export const FILENAME_SANITIZE_REGEX = /[^\w.-]/g
export const MEMORANDUM_UPLOAD_MAX_SIZE_MB = 5
export const RECEIPT_UPLOAD_MAX_SIZE_MB = 10
export const MEMORANDUM_DOWNLOAD_URL_EXPIRY_SECONDS = 3600
export const COST_BREAKDOWN_RECEIPT_DOWNLOAD_URL_EXPIRY_SECONDS = 900

export const ALLOWED_RECEIPT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
] as const
