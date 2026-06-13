import type { Readable } from 'node:stream'
import crypto from 'node:crypto'
import { DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
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

export function getClient(): S3Client {
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
  folder: 'memorandos' | 'comprovantes' | 'formulario-preferencias' | 'reports'
  subfolder?: string
  prefix?: string
}

export type UploadStreamOptions = {
  stream: Readable
  fileName: string
  contentType: string
  folder: 'reports'
  subfolder?: string
}

export type UploadFileResult = {
  fileKey: string
  fileName: string
  fileSize?: number
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

export async function uploadStream(options: UploadStreamOptions): Promise<UploadFileResult> {
  const { stream, fileName, contentType, folder, subfolder } = options
  const uniqueId = crypto.randomUUID()
  const sanitizedFileName = fileName.replace(FILENAME_SANITIZE_REGEX, '_')

  const path = subfolder ? `${folder}/${subfolder}` : folder
  const fileKey = `${path}/${uniqueId}-${sanitizedFileName}`

  const upload = new Upload({
    client: getClient(),
    params: {
      Bucket: env.R2_BUCKET_NAME!,
      Key: fileKey,
      Body: stream,
      ContentType: contentType,
    },
  })

  await upload.done()

  return {
    fileKey,
    fileName: sanitizedFileName,
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

/**
 * Deleta múltiplos objetos do bucket R2 em lote (até 1000 por chamada).
 * Aceita lista vazia (no-op) para evitar chamadas desnecessárias.
 */
export async function deleteObjects(keys: string[]): Promise<void> {
  if (keys.length === 0)
    return

  const BATCH_SIZE = 1000
  for (let i = 0; i < keys.length; i += BATCH_SIZE) {
    const batch = keys.slice(i, i + BATCH_SIZE)
    await getClient().send(new DeleteObjectsCommand({
      Bucket: env.R2_BUCKET_NAME!,
      Delete: { Objects: batch.map(Key => ({ Key })) },
    }))
  }
}

export async function validatePDF(file: File, maxSizeInMB: number = 5): Promise<{ valid: boolean, error?: string }> {
  const maxSizeBytes = maxSizeInMB * 1024 * 1024

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File exceeds the maximum size of ${maxSizeInMB}MB`,
    }
  }

  const pdfSignature = await file.slice(0, 4).text()
  if (pdfSignature !== '%PDF') {
    return {
      valid: false,
      error: 'File is not a valid PDF',
    }
  }

  return { valid: true }
}
