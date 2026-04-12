import type { AppContext } from '@/lib/type'
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { jwt } from 'hono/jwt'
import * as codes from 'stoker/http-status-codes'
import env from '@/env'

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
      c.get('logger').warn(`Falha de Autenticação [401]: ${error.message}`)
      return c.json(
        { message: 'Acesso negado. É necessário estar autenticado para continuar.' },
        codes.UNAUTHORIZED,
      )
    }
    throw error
  }
})
