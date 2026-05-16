import { vi } from 'vitest'

/** Substituído via alias Vitest — evita chamadas reais ao SDK durante testes. */
export const getSignedUrl = vi.fn(async () => 'https://signed.example.com/object?X-Amz-Expires=3600')
