import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import crypto from 'node:crypto'
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

export interface UploadFileOptions {
  file: Buffer
  fileName: string
  contentType: string
  folder: 'memorandos' | 'admin-attachments'
}

export interface UploadFileResult {
  fileKey: string
  fileName: string
  fileSize: number
}

export async function uploadFile(options: UploadFileOptions): Promise<UploadFileResult> {
  const { file, fileName, contentType, folder } = options

  const uniqueId = crypto.randomUUID()
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const fileKey = `${folder}/${uniqueId}-${sanitizedFileName}`

  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME!,
    Key: fileKey,
    Body: file,
    ContentType: contentType,
  })

  await getClient().send(command)

  return {
    fileKey,
    fileName: sanitizedFileName,
    fileSize: file.length,
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

export function validatePDF(file: Buffer, maxSizeInMB: number = 5): { valid: boolean, error?: string } {
  const maxSizeBytes = maxSizeInMB * 1024 * 1024

  if (file.length > maxSizeBytes) {
    return { valid: false, error: `Arquivo excede o tamanho máximo de ${maxSizeInMB}MB` }
  }

  const pdfSignature = file.slice(0, 4).toString('ascii')
  if (pdfSignature !== '%PDF') {
    return { valid: false, error: 'Arquivo não é um PDF válido' }
  }

  return { valid: true }
}
