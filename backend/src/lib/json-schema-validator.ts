import type { BetterAjvErrorsOptions } from '@apideck/better-ajv-errors'
import type { DefinedError } from 'ajv'
import type { ValidationErrorItem } from '@/schemas/shared.schema'
import Ajv from 'ajv'
import addErrors from 'ajv-errors'
import addFormats from 'ajv-formats'
import { ZodIssueCode } from 'zod'

// --- AJV CONFIGURATION ---

const ajv = new Ajv({
  allErrors: true,
  $data: true,
  strict: false,
  useDefaults: true,
})

addFormats(ajv)
addErrors(ajv)

const R2_KEY_REGEX = /^formulario-preferencias\/[\w/.-]+$/

ajv.addFormat('r2-key', {
  validate: (key: string) =>
    typeof key === 'string'
    && R2_KEY_REGEX.test(key),
})

ajv.addKeyword({
  keyword: 'dateAfter',
  type: 'string',
  $data: true,
  validate: (otherDateStr: any, currentDateStr: any) => {
    if (!currentDateStr || !otherDateStr)
      return true
    const current = new Date(currentDateStr)
    const other = new Date(otherDateStr)
    return !Number.isNaN(current.getTime()) && !Number.isNaN(other.getTime()) ? current > other : true
  },
  error: { message: 'RETURN_DATE_BEFORE_DEPARTURE' },
})

export default ajv

// --- AJV ERROR FORMATTING ---

/**
 * Mapeia keywords do AJV para códigos do Zod (ZodIssueCode).
 */
const AJV_TO_ZOD_CODE_MAP: Record<string, typeof ZodIssueCode[keyof typeof ZodIssueCode]> = {
  required: ZodIssueCode.invalid_type,
  type: ZodIssueCode.invalid_type,
  enum: ZodIssueCode.invalid_value,
  const: ZodIssueCode.invalid_value,
  minimum: ZodIssueCode.too_small,
  maximum: ZodIssueCode.too_big,
  minLength: ZodIssueCode.too_small,
  maxLength: ZodIssueCode.too_big,
  minItems: ZodIssueCode.too_small,
  maxItems: ZodIssueCode.too_big,
  format: ZodIssueCode.invalid_format,
  pattern: ZodIssueCode.invalid_format,
  additionalProperties: ZodIssueCode.unrecognized_keys,
  dateAfter: ZodIssueCode.custom,
}

const SLASH_START_REGEX = /^\//
const SLASH_GLOBAL_REGEX = /\//g

/**
 * Formata erros do AJV para o padrão da aplicação de forma determinística.
 * Aborda diretamente os erros brutos para garantir performance O(N) e caminhos precisos.
 */
export function formatAjvErrors(options: BetterAjvErrorsOptions): ValidationErrorItem[] {
  const { errors, basePath } = options

  if (!errors)
    return []

  // Cast único para DefinedError para habilitar o Type Narrowing automático do TS no switch
  return (errors as DefinedError[]).map((err) => {
    const keyword = err.keyword

    // CONSTRUÇÃO DO DOT NOTATION:
    // AJV usa "/caminho/do/campo". Convertemos para "caminho.do.campo"
    let fieldPath = err.instancePath
      .replace(SLASH_START_REGEX, '')
      .replace(SLASH_GLOBAL_REGEX, '.')

    let params: Record<string, any> | undefined

    // TYPE NARROWING: O TS "abre" o tipo do params baseado na keyword
    switch (keyword) {
      case 'required': {
        const missing = err.params.missingProperty
        fieldPath = fieldPath ? `${fieldPath}.${missing}` : missing
        params = {
          expected: 'any',
          received: 'undefined',
        }
        break
      }

      case 'type':
        params = { expected: err.params.type }
        break

      case 'enum':
        params = { options: err.params.allowedValues }
        break

      case 'const':
        params = { expected: err.params.allowedValue }
        break

      case 'minLength':
      case 'maxLength': {
        const isMin = keyword === 'minLength'
        params = {
          [isMin ? 'minimum' : 'maximum']: err.params.limit,
          inclusive: true,
          type: 'string',
        }
        break
      }

      case 'minItems':
      case 'maxItems': {
        const isMin = keyword === 'minItems'
        params = {
          [isMin ? 'minimum' : 'maximum']: err.params.limit,
          inclusive: true,
          type: 'array',
        }
        break
      }

      case 'minimum':
      case 'maximum': {
        const isMin = keyword === 'minimum'
        params = {
          [isMin ? 'minimum' : 'maximum']: err.params.limit,
          inclusive: true,
          type: 'number',
        }
        break
      }

      case 'format':
        params = { validation: err.params.format }
        break

      case 'pattern':
        params = { validation: 'regex' }
        break

      case 'additionalProperties':
        params = { keys: [err.params.additionalProperty] }
        break

      default:
        // Caso para keywords customizadas (ex: dateAfter) ou não mapeadas
        params = (keyword as string) === 'dateAfter'
          ? { validation: 'dateAfter' }
          : (Object.keys(err.params).length > 0 ? err.params : undefined)
    }

    // Se houver um prefixo de contexto (ex: de um middleware), nós o preservamos
    const field = basePath ? `${basePath}.${fieldPath}` : fieldPath

    return {
      field,
      message: err.message || 'Invalid value',
      code: AJV_TO_ZOD_CODE_MAP[keyword] || ZodIssueCode.custom,
      params,
    }
  })
}
