import type { CookieOptions } from 'hono/utils/cookie'
import env from '@/env'

export const PASSWORD_RESET_TOKEN_EXPIRES_IN_HOURS = 1

export function getRefreshTokenCookieOptions(): CookieOptions {
  const sameSite = env.COOKIE_SAME_SITE

  // RFC: Se sameSite for None, secure TEM que ser true
  const isSecure = sameSite === 'None' ? true : env.NODE_ENV === 'production'

  return {
    path: '/',
    httpOnly: true,
    secure: isSecure,
    sameSite,
    maxAge: env.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60, // Dias em Segundos
  }
}
