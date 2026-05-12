import crypto from 'node:crypto'
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { FILENAME_SANITIZE_REGEX } from '@/constants/file.constant'
import env from '@/env'

function r2Configured(): boolean {
  return !!(env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_ENDPOINT && env.R2_BUCKET_NAME)
}

export function isStorageConfigured(): boolean {
  return r2Configured()
}

let _client: S3Client | null = null

function getClient(): S3Client {
  if (!r2Configured()) {
    throw new Error('STORAGE_NOT_CONFIGURED')
  }
  if (!_client) {
    _client = new S3Client({
      region: 'auto',
      endpoint: env.R2_ENDPOINT,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID!,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
      },
    })
  }
  return _client
}

export type UploadFileOptions = {
  file: File
  contentType: string
  folder: 'memorandos' | 'comprovantes'
  subfolder?: string
  prefix?: string
}

export type UploadFileResult = {
  fileKey: string
  fileName: string
  fileSize: number
}

export async function uploadFile(options: UploadFileOptions): Promise<UploadFileResult> {
  const { file, contentType, folder, subfolder, prefix } = options
  const uniqueId = crypto.randomUUID()
  const sanitizedFileName = file.name.replace(FILENAME_SANITIZE_REGEX, '_')

  const path = subfolder ? `${folder}/${subfolder}` : folder
  const fileName = prefix ? `${prefix}_${uniqueId}-${sanitizedFileName}` : `${uniqueId}-${sanitizedFileName}`
  const fileKey = `${path}/${fileName}`

  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME!,
    Key: fileKey,
    Body: new Uint8Array(await file.arrayBuffer()),
    ContentType: contentType,
  })

  await getClient().send(command)

  return {
    fileKey,
    fileName: sanitizedFileName,
    fileSize: file.size,
  }
}

export async function getSignedDownloadUrl(fileKey: string, expiresInSeconds: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: env.R2_BUCKET_NAME!,
    Key: fileKey,
  })

  return getSignedUrl(getClient(), command, { expiresIn: expiresInSeconds })
}

export async function deleteFile(fileKey: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: env.R2_BUCKET_NAME!,
    Key: fileKey,
  })

  await getClient().send(command)
}

export async function validatePDF(file: File, maxSizeInMB: number = 5): Promise<{ valid: boolean, error?: string }> {
  const maxSizeBytes = maxSizeInMB * 1024 * 1024

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `Arquivo excede o tamanho máximo de ${maxSizeInMB}MB`,
    }
  }

  const pdfSignature = await file.slice(0, 4).text()
  if (pdfSignature !== '%PDF') {
    return {
      valid: false,
      error: 'Arquivo não é um PDF válido',
    }
  }

  return { valid: true }
}
