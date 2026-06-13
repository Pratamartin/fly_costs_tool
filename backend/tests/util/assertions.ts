import type { ProblemDetails } from 'hono-problem-details'
import type { ProblemCode } from '@/lib/problems'
import type { AppProblemExtensions } from '@/lib/type'
import { expect } from 'vitest'
import { PROBLEM_DEFINITIONS } from '@/lib/problems'

/**
 * Utilitário para validar respostas no formato RFC 9457 (Problem Details).
 * Utiliza o mapeamento global de extensões para fornecer autocomplete e tipagem
 * forte baseada no código de erro fornecido.
 *
 * @param res - A resposta do fetch/hono client
 * @param keyOrExpected - Chave semântica (ex: 'INVALID_TRANSITION') ou objeto customizado
 * @param expectedExtensions - (Opcional) Extensões para validar. O TS infere o tipo baseado na chave!
 */
export async function expectProblem<
  K extends ProblemCode,
  T extends Record<string, unknown> = K extends keyof AppProblemExtensions
    ? AppProblemExtensions[K]
    : Record<string, never>,
>(
  res: Response,
  keyOrExpected: K | { status: number, type: string, title?: string },
  expectedExtensions?: Partial<T>,
) {
  const expected = typeof keyOrExpected === 'string'
    ? PROBLEM_DEFINITIONS[keyOrExpected]
    : keyOrExpected

  // Validação do envelope HTTP (RFC 9457)
  expect(res.status).toBe(expected.status)
  expect(res.headers.get('content-type')).toContain('application/problem+json')

  // O cast garante que o retorno contenha os campos padrão e as extensões específicas
  const json = await res.json() as ProblemDetails<T> & T

  // Validação da estrutura básica do Problem Details
  expect(json).toMatchObject({
    type: expected.type,
    status: expected.status,
    instance: expect.any(String),
    ...(expected.title ? { title: expected.title } : {}),
  })

  // Se o registro define um detalhe padrão, validamos sua presença
  if ('detail' in expected && expected.detail) {
    expect(json.detail).toBeDefined()
    expect(typeof json.detail).toBe('string')
  }

  // Validação unificada de extensões (errors, resourceState, stack, etc.)
  if (expectedExtensions) {
    // toMatchObject já realiza uma comparação parcial (subset),
    // o que é ideal para validar apenas os campos relevantes da extensão.
    expect(json).toMatchObject(expectedExtensions)
  }

  return json
}
