/**
 * T3.3.1 — storage.test.ts (r2.test.ts)
 * Mock do cliente S3: uploadFile chama PutObjectCommand com key correta |
 * getSignedDownloadUrl retorna URL com expiração correta
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { awsSendMock, PutObjectCommand } from './mocks/aws-s3-client'
// alias → mocks/aws-s3-request-presigner.ts
import { getSignedUrl as getSignedUrlMock } from '@aws-sdk/s3-request-presigner'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/env', () => ({
  default: {
    R2_ACCESS_KEY_ID: 'test-access-key',
    R2_SECRET_ACCESS_KEY: 'test-secret-key',
    R2_ENDPOINT: 'https://account.r2.cloudflarestorage.com',
    R2_BUCKET_NAME: 'fly-costs-test-bucket',
  },
}))

import { deleteFile, getSignedDownloadUrl, uploadFile, validatePDF } from '@/lib/storage'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePDFFile(sizeBytes: number = 64, name = 'doc.pdf'): File {
  const buf = new Uint8Array(sizeBytes)
  // Assinatura PDF nos primeiros 4 bytes
  buf[0] = 0x25 // %
  buf[1] = 0x50 // P
  buf[2] = 0x44 // D
  buf[3] = 0x46 // F
  return new File([buf], name, { type: 'application/pdf' })
}

function makeFileFromText(content: string, name = 'file.txt', type = 'text/plain'): File {
  return new File([content], name, { type })
}

// ─── T3.3.1 — uploadFile ──────────────────────────────────────────────────────

describe('uploadFile — T3.3.1 (unit)', () => {
  beforeEach(() => {
    awsSendMock.mockReset()
    awsSendMock.mockResolvedValue({})
  })

  it('chama PutObjectCommand com Bucket e Key corretos', async () => {
    const file = makePDFFile(64, 'doc.pdf')

    await uploadFile({ file, contentType: 'application/pdf', folder: 'memorandos' })

    expect(awsSendMock).toHaveBeenCalledOnce()
    const cmd = awsSendMock.mock.calls[0][0] as PutObjectCommand
    const input = cmd.input as Record<string, unknown>
    expect(input.Bucket).toBe('fly-costs-test-bucket')
    expect(input.Key).toMatch(/^memorandos\//)
    expect(input.Key as string).toContain('doc.pdf')
  })

  it('a key gerada contém UUID e nome sanitizado do arquivo', async () => {
    const file = makeFileFromText('data', 'meu arquivo (1).pdf', 'application/pdf')

    await uploadFile({ file, contentType: 'application/pdf', folder: 'comprovantes' })

    const cmd = awsSendMock.mock.calls[0][0] as PutObjectCommand
    const key = (cmd.input as Record<string, string>).Key

    expect(key).toMatch(/^comprovantes\//)
    expect(key).not.toContain(' ')
    expect(key).not.toContain('(')
  })

  it('retorna metadados com fileKey, fileName e fileSize', async () => {
    const file = new File([new Uint8Array(1024)], 'foto.jpg', { type: 'image/jpeg' })

    const result = await uploadFile({ file, contentType: 'image/jpeg', folder: 'comprovantes' })

    expect(result.fileKey).toMatch(/^comprovantes\//)
    expect(result.fileName).toContain('foto.jpg')
    expect(result.fileSize).toBe(1024)
  })

  it('chama ContentType correto no PutObjectCommand', async () => {
    const file = new File([new Uint8Array(32)], 'img.png', { type: 'image/png' })

    await uploadFile({ file, contentType: 'image/png', folder: 'comprovantes' })

    const cmd = awsSendMock.mock.calls[0][0] as PutObjectCommand
    const input = cmd.input as Record<string, string>
    expect(input.ContentType).toBe('image/png')
  })

  it('usa subfolder quando fornecido — key inclui expenseId no caminho', async () => {
    const expenseId = 'expense-uuid-123'
    const file = new File([new Uint8Array(32)], 'recibo.jpg', { type: 'image/jpeg' })

    await uploadFile({ file, contentType: 'image/jpeg', folder: 'comprovantes', subfolder: expenseId })

    const cmd = awsSendMock.mock.calls[0][0] as PutObjectCommand
    const key = (cmd.input as Record<string, string>).Key
    expect(key).toMatch(new RegExp(`^comprovantes/${expenseId}/`))
  })

  it('usa prefix quando fornecido — key contém o prefix antes do UUID', async () => {
    const file = new File([new Uint8Array(32)], 'bilhete.pdf', { type: 'application/pdf' })

    await uploadFile({
      file,
      contentType: 'application/pdf',
      folder: 'comprovantes',
      subfolder: 'exp-001',
      prefix: 'passagem',
    })

    const cmd = awsSendMock.mock.calls[0][0] as PutObjectCommand
    const key = (cmd.input as Record<string, string>).Key
    expect(key).toContain('passagem')
  })
})

// ─── T3.3.1 — getSignedDownloadUrl ────────────────────────────────────────────

describe('getSignedDownloadUrl — T3.3.1 (unit)', () => {
  beforeEach(() => {
    vi.mocked(getSignedUrlMock).mockReset()
    vi.mocked(getSignedUrlMock).mockResolvedValue('https://signed.example.com/file.pdf?X-Amz-Expires=3600')
  })

  it('retorna URL assinada de download', async () => {
    const url = await getSignedDownloadUrl('memorandos/abc-doc.pdf')

    expect(url).toBe('https://signed.example.com/file.pdf?X-Amz-Expires=3600')
    expect(getSignedUrlMock).toHaveBeenCalledOnce()
  })

  it('getSignedUrl é chamado com expiresIn de 3600 segundos (padrão 1h)', async () => {
    await getSignedDownloadUrl('memorandos/arquivo.pdf')

    // getSignedUrl(client, command, options) — options é o 3° argumento (índice 2)
    const [, , options] = vi.mocked(getSignedUrlMock).mock.calls[0] as [unknown, unknown, { expiresIn: number }]
    expect(options.expiresIn).toBe(3600)
  })

  it('aceita expiresIn customizado', async () => {
    await getSignedDownloadUrl('memorandos/arquivo.pdf', 7200)

    const [, , options] = vi.mocked(getSignedUrlMock).mock.calls[0] as [unknown, unknown, { expiresIn: number }]
    expect(options.expiresIn).toBe(7200)
  })
})

// ─── validatePDF — T3.3.1 ────────────────────────────────────────────────────

describe('validatePDF — T3.3.1 (unit)', () => {
  it('retorna valid:true para File com assinatura PDF válida e tamanho ok', async () => {
    const file = makePDFFile(64)

    const result = await validatePDF(file)

    expect(result.valid).toBe(true)
  })

  it('retorna valid:false para arquivo sem assinatura PDF', async () => {
    const file = makeFileFromText('hello world — not a pdf', 'doc.txt')

    const result = await validatePDF(file)

    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
    expect(result.error).toContain('PDF')
  })

  it('retorna valid:false para arquivo maior que 5 MB (padrão)', async () => {
    const tooBig = new Uint8Array(6 * 1024 * 1024)
    tooBig[0] = 0x25 // %
    tooBig[1] = 0x50 // P
    tooBig[2] = 0x44 // D
    tooBig[3] = 0x46 // F
    const file = new File([tooBig], 'huge.pdf', { type: 'application/pdf' })

    const result = await validatePDF(file)

    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/tamanho|limite|MB|size/i)
  })
})

// ─── deleteFile — T3.3.1 ─────────────────────────────────────────────────────

describe('deleteFile — T3.3.1 (unit)', () => {
  beforeEach(() => {
    awsSendMock.mockReset()
    awsSendMock.mockResolvedValue({})
  })

  it('chama DeleteObjectCommand com Bucket e Key corretos', async () => {
    await deleteFile('memorandos/uuid-file.pdf')

    expect(awsSendMock).toHaveBeenCalledOnce()
    const cmd = awsSendMock.mock.calls[0][0] as { input: Record<string, string> }
    expect(cmd.input.Bucket).toBe('fly-costs-test-bucket')
    expect(cmd.input.Key).toBe('memorandos/uuid-file.pdf')
  })
})
