import { awsSendMock } from '@aws-sdk/client-s3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/env', () => ({
  default: {
    R2_ACCESS_KEY_ID: 'test-access',
    R2_SECRET_ACCESS_KEY: 'test-secret',
    R2_ENDPOINT: 'https://example.r2.cloudflarestorage.com',
    R2_BUCKET_NAME: 'test-bucket',
  },
}))

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn(async () => 'https://signed.example/object'),
}))

import { deleteFile, uploadFile, validatePDF } from '../../backend/src/lib/storage'

function pdfBuffer(bodySize = 8) {
  const buf = Buffer.alloc(Math.max(bodySize, 8))
  buf.write('%PDF', 0, 'ascii')
  buf.write('-1.4', 4, 'ascii')
  return buf
}

describe('storage — anexos admin / upload R2', () => {
  beforeEach(() => {
    awsSendMock.mockReset()
    awsSendMock.mockResolvedValue({})
  })

  it('uploadFile envia objeto ao bucket e devolve metadados', async () => {
    const file = pdfBuffer()
    const result = await uploadFile({
      file,
      fileName: 'relatorio.pdf',
      contentType: 'application/pdf',
      folder: 'admin-attachments',
    })

    expect(result.fileKey).toMatch(/^admin-attachments\/[0-9a-f-]+-relatorio\.pdf$/)
    expect(result.fileName).toBe('relatorio.pdf')
    expect(result.fileSize).toBe(file.length)
    expect(awsSendMock).toHaveBeenCalledTimes(1)
  })

  it('múltiplos uploads geram chaves distintas', async () => {
    const a = await uploadFile({
      file: pdfBuffer(),
      fileName: 'a.pdf',
      contentType: 'application/pdf',
      folder: 'admin-attachments',
    })
    const b = await uploadFile({
      file: pdfBuffer(),
      fileName: 'b.pdf',
      contentType: 'application/pdf',
      folder: 'admin-attachments',
    })

    expect(a.fileKey).not.toBe(b.fileKey)
    expect(awsSendMock).toHaveBeenCalledTimes(2)
  })

  it('validatePDF rejeita arquivo que não é PDF', () => {
    const buf = Buffer.from('hello world')
    const r = validatePDF(buf)
    expect(r.valid).toBe(false)
    expect(r.error).toMatch(/PDF/)
  })

  it('validatePDF rejeita arquivo acima do limite de tamanho', () => {
    const huge = Buffer.alloc(6 * 1024 * 1024)
    huge.write('%PDF', 0, 'ascii')
    const r = validatePDF(huge, 5)
    expect(r.valid).toBe(false)
    expect(r.error).toMatch(/5MB/)
  })

  it('deleteFile envia DeleteObject ao cliente', async () => {
    await deleteFile('admin-attachments/k1-doc.pdf')
    expect(awsSendMock).toHaveBeenCalledTimes(1)
    const cmd = awsSendMock.mock.calls[0][0] as { input: { Bucket: string, Key: string } }
    expect(cmd.input).toEqual({
      Bucket: 'test-bucket',
      Key: 'admin-attachments/k1-doc.pdf',
    })
  })

  it('validatePDF aceita PDF dentro do limite', () => {
    expect(validatePDF(pdfBuffer(1024), 5).valid).toBe(true)
  })
})
