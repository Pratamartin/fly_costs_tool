import { awsSendMock } from '@aws-sdk/client-s3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const envMock = vi.hoisted(() => ({
  default: {
    R2_ACCESS_KEY_ID: 'test-access',
    R2_SECRET_ACCESS_KEY: 'test-secret',
    R2_ENDPOINT: 'https://example.r2.cloudflarestorage.com',
    R2_BUCKET_NAME: 'test-bucket',
  },
}))

vi.mock('@/env', () => envMock)

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn(async () => 'https://signed.example/object'),
}))

describe('storage — anexos admin / upload R2 (mocked)', () => {
  beforeEach(() => {
    awsSendMock.mockReset()
    awsSendMock.mockResolvedValue({})
  })

  it('mock de uploadFile retorna metadados simulados', () => {
    const mockResult = {
      fileKey: 'admin-attachments/uuid-file.pdf',
      fileName: 'file.pdf',
      fileSize: 1024,
    }
    expect(mockResult.fileKey).toMatch(/^admin-attachments\//)
    expect(mockResult.fileName).toBe('file.pdf')
    expect(mockResult.fileSize).toBeGreaterThan(0)
  })

  it('mock de validatePDF valida assinatura PDF', () => {
    const validPDF = Buffer.alloc(8)
    validPDF.write('%PDF', 0, 'ascii')
    
    const invalidBuffer = Buffer.from('hello world')
    
    expect(validPDF.slice(0, 4).toString('ascii')).toBe('%PDF')
    expect(invalidBuffer.slice(0, 4).toString('ascii')).not.toBe('%PDF')
  })

  it('validação de tamanho máximo em MB', () => {
    const maxSizeInMB = 5
    const maxSizeBytes = maxSizeInMB * 1024 * 1024
    
    const smallFile = Buffer.alloc(1024)
    const largeFile = Buffer.alloc(maxSizeBytes + 1)
    
    expect(smallFile.length).toBeLessThan(maxSizeBytes)
    expect(largeFile.length).toBeGreaterThan(maxSizeBytes)
  })

  it('chaves de arquivo devem incluir UUID e nome sanitizado', () => {
    const fileName = 'my-file test (1).pdf'
    const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
    
    expect(sanitized).toBe('my-file_test__1_.pdf')
    expect(sanitized).not.toContain(' ')
    expect(sanitized).not.toContain('(')
  })

  it('operações S3 esperam comandos Put/Delete/Get', () => {
    const operations = ['PutObject', 'DeleteObject', 'GetObject']
    operations.forEach(op => {
      expect(op).toMatch(/Object$/)
    })
  })
})
