import type { AppContext } from '@/lib/type'
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { jwt } from 'hono/jwt'
import { JwtTokenExpired } from 'hono/utils/jwt/types'
import * as codes from 'stoker/http-status-codes'
import env from '@/env'
import { problems } from '@/lib/problems'

export default createMiddleware<AppContext>(async (c, next) => {
  const jwtMiddleware = jwt({
    secret: env.JWT_SECRET,
    alg: 'HS256',
  })

  try {
    await jwtMiddleware(c, next)
  }
  catch (error) {
    if (error instanceof HTTPException && error.status === codes.UNAUTHORIZED) {
      c.get('logger').warn(`Authentication Failure [401]: ${error.message}`)

      if (error.cause instanceof JwtTokenExpired) {
        throw problems.create('SESSION_EXPIRED')
      }

      throw problems.create('UNAUTHORIZED', { detail: 'Access denied. You must be authenticated to continue.' })
    }
    throw error
  }
})
