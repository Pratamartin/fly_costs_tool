import type { UserRole } from '@/generated/prisma/enums'
import type { AppContext } from '@/lib/type'
import { createMiddleware } from 'hono/factory'
import * as codes from 'stoker/http-status-codes'

export default function requireRole(roles: UserRole[]) {
  return createMiddleware<AppContext>(async (c, next) => {
    const jwt = c.get('jwtPayload')
    if (!roles.includes(jwt.role)) {
      c.get('logger').warn(
        `Acesso Negado [403]: Usuário ${jwt.sub} (Role: ${jwt.role}) tentou acessar '${c.req.method} ${c.req.path}' que exige as roles: [${roles.join(', ')}]`,
      )
      return c.json({ message: 'Acesso negado. Você não tem permissão para acessar este recurso.' }, codes.FORBIDDEN)
    }

    await next()
  })
}
