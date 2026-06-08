import type { BetterAjvErrorsOptions } from '@apideck/better-ajv-errors'
import type { DefinedError } from 'ajv'
import type { ValidationErrorItem } from '@/schemas/shared.schema'
import { betterAjvErrors } from '@apideck/better-ajv-errors'
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
    return !Number.isNaN(current.getTime()) && !Number.isNaN(other.getTime()) ? current >= other : true
  },
  error: { message: 'RETURN_DATE_BEFORE_DEPARTURE' },
})

export default ajv

// --- AJV ERROR FORMATTING ---

/**
 * Mapeia keywords do AJV para códigos do Zod (ZodIssueCode)
 * para manter compatibilidade com o contrato ValidationErrorResponse.
 * Usamos os literais exatos do Zod v4.
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
}

const SLASH_START_REGEX = /^\//
const SLASH_GLOBAL_REGEX = /\//g

/**
 * Formata erros do AJV para o padrão da aplicação.
 * Utiliza @apideck/better-ajv-errors para conversão robusta para Dot Notation.
 */
export function formatAjvErrors(options: BetterAjvErrorsOptions): ValidationErrorItem[] {
  const { errors } = options

  if (!errors)
    return []

  // 1. Utiliza a biblioteca para converter caminhos e limpar mensagens
  // O betterAjvErrors já cuida da Dot Notation e de mapear 'required' corretamente.
  const betterErrors = betterAjvErrors(options)

  // 2. Mapeia para o nosso contrato final (ValidationErrorItem)
  return betterErrors.map((err, index) => {
    // Recupera a keyword do erro original correspondente para manter o código correto
    const originalError = errors[index] as DefinedError | undefined
    const code = originalError
      ? (AJV_TO_ZOD_CODE_MAP[originalError.keyword] || ZodIssueCode.custom)
      : ZodIssueCode.custom

    let params: Record<string, any> | undefined

    if (originalError && 'params' in originalError) {
      params = { ...originalError.params }
      // Normalize AJV limits to Zod min/max
      if (['minLength', 'minItems', 'minimum', 'exclusiveMinimum'].includes(originalError.keyword)) {
        if (params && 'limit' in params) {
          params.min = params.limit
          delete params.limit
        }
      }
      if (['maxLength', 'maxItems', 'maximum', 'exclusiveMaximum'].includes(originalError.keyword)) {
        if (params && 'limit' in params) {
          params.max = params.limit
          delete params.limit
        }
      }
    }

    return {
      field: err.path.replace(SLASH_START_REGEX, '').replace(SLASH_GLOBAL_REGEX, '.'),
      message: err.message,
      code,
      params: params && Object.keys(params).length > 0 ? params : undefined,
    }
  })
}
