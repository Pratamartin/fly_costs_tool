import { vi } from 'vitest'

/** Substituído via alias Vitest — evita TLS real durante upload/delete nos testes. */
export const awsSendMock = vi.fn().mockResolvedValue({})

export class S3Client {
  send = awsSendMock
}

export class PutObjectCommand {
  constructor(public input: unknown) {}
}

export class DeleteObjectCommand {
  constructor(public input: unknown) {}
}

export class GetObjectCommand {
  constructor(public input: unknown) {}
}
