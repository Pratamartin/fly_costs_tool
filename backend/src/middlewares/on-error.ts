import { ProblemDetailsError, problemDetailsHandler } from 'hono-problem-details'
import { HTTPException } from 'hono/http-exception'
import { ZodError } from 'zod'
import env from '@/env'
import { problems } from '@/lib/problems'

const onError = problemDetailsHandler({
  autoInstance: true,
  includeStack: env.NODE_ENV === 'development',

  mapError: (error: unknown) => {
    // 1. Schema Validation (Zod)
    if (error instanceof ZodError) {
      return problems.create('VALIDATION_ERROR', {
        extensions: {
          errors: error.issues.map((issue) => {
            const { code, path, message } = issue

            // Extração segura de metadados sem acessar 'params' diretamente no tipo ZodIssue
            const metadata = issue as Record<string, any>
            const { params, ...rest } = metadata

            // Achatamos o objeto para evitar params.params em refinamentos customizados
            const combinedParams = {
              ...rest,
              ...(typeof params === 'object' && params !== null ? params : {}),
            }

            // Destruturação limpa para remover chaves redundantes sem usar 'delete'
            const { code: _c, path: _p, message: _m, ...finalParams } = combinedParams

            return {
              field: path.join('.'),
              code,
              params: Object.keys(finalParams).length > 0 ? finalParams : undefined,
              message,
            }
          }),
        },
      }).problemDetails
    }

    // 2. Domain Errors (Thrown via problems.create(...).throw())
    if (error instanceof ProblemDetailsError) {
      return error.problemDetails
    }

    // 3. Infrastructure Safety Net for HTTPException (Framework/Third-party)
    if (error instanceof HTTPException) {
      return {
        status: error.status,
        title: error.name,
        detail: error.message,
        type: 'urn:sgda:infra:system:http-exception',
      }
    }

    // 4. Final Fallback (Unknown server errors)
    return problems.create('INTERNAL_SERVER_ERROR').problemDetails
  },
})

export default onError
