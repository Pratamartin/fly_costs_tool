import type { AnySchema } from 'ajv'
import type { MiddlewareHandler } from 'hono'
import ajv, { formatAjvErrors } from '@/lib/json-schema-validator'
import { problems } from '@/lib/problems'

export default function validateJsonSchema(property: string, schema: AnySchema, optional = false): MiddlewareHandler {
  const validate = ajv.compile(schema)

  return async (c, next) => {
    const body = await c.req.json()
    const data = body[property]

    if (optional && data === undefined) {
      return next()
    }

    if (!validate(data)) {
      const errors = formatAjvErrors({
        errors: validate.errors,
        schema,
        data,
        basePath: property,
      })

      throw problems.create('VALIDATION_ERROR', { extensions: { errors } })
    }

    await next()
  }
}
