import type { AnySchema } from 'ajv'
import type { MiddlewareHandler } from 'hono'
import * as codes from 'stoker/http-status-codes'
import ajv from '@/lib/json-schema-validator'

export default function validateJsonSchema(property: string, schema: AnySchema): MiddlewareHandler {
  const validate = ajv.compile(schema)

  return async (c, next) => {
    const body = await c.req.json()
    const data = body[property]

    if (!validate(data)) {
      const errors = validate.errors?.map(err => `${property}: ${err.instancePath} ${err.message}`)
      return c.json({ errors }, codes.UNPROCESSABLE_ENTITY)
    }

    await next()
  }
}
