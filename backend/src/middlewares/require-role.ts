import type { UserRole } from '@/generated/prisma/enums'
import type { AppContext } from '@/lib/type'
import { createMiddleware } from 'hono/factory'
import { problems } from '@/lib/problems'

export default function requireRole(roles: UserRole[]) {
  return createMiddleware<AppContext>(async (c, next) => {
    const jwt = c.get('jwtPayload')
    if (!roles.includes(jwt.role)) {
      c.get('logger').warn(
        `Access Denied [403]: User ${jwt.sub} (Role: ${jwt.role}) attempted to access '${c.req.method} ${c.req.path}' which requires the roles: [${roles.join(', ')}]`,
      )

      throw problems.create('FORBIDDEN', {
        detail: 'Access denied. You do not have permission to access this resource.',
        extensions: {
          requiredRoles: roles,
          userRole: jwt.role,
        },
      })
    }

    await next()
  })
}
