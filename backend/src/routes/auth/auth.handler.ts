import type { ForgotPasswordRoute, LoginRoute, LogoutRoute, RefreshRoute, RegisterRoute, ResetPasswordRoute, VerifyInviteRoute } from './auth.route'
import type { AppRouteHandler } from '@/lib/type'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import * as codes from 'stoker/http-status-codes'
import { getRefreshTokenCookieOptions } from '@/constants/auth.constant'
import env from '@/env'
import { emailService } from '@/lib/email/service'
import prisma from '@/lib/orm'
import { problems } from '@/lib/problems'
import { createPasswordResetToken, createSession, extendSession, generateAccessToken, generateRefreshToken, resetPassword as resetPasswordService, revokeSession, validateSession, verifyCredentials, verifyRefreshToken } from '@/services/auth.service'
import { findInviteByCode, validateAndConsume } from '@/services/invite.service'
import { createUser, getUserByEmail } from '@/services/user.service'

export const register: AppRouteHandler<RegisterRoute> = async (c) => {
  const data = c.req.valid('json')

  const existingUser = await getUserByEmail(data.email)
  if (!('error' in existingUser)) {
    throw problems.create('EMAIL_ALREADY_EXISTS')
  }

  const result = await prisma.$transaction(async (tx) => {
    const inviteResult = await findInviteByCode(data.inviteCode, tx)
    if ('error' in inviteResult) {
      return inviteResult
    }

    const newUser = await createUser(data, env.SALT_ROUNDS, tx)

    const consumeResult = await validateAndConsume(data.inviteCode, newUser.id, tx)
    if ('error' in consumeResult) {
      return consumeResult
    }

    return { data: newUser }
  })

  if ('error' in result) {
    throw problems.create(result.error, { extensions: result.context })
  }

  return c.json(result.data, codes.CREATED)
}

export const verifyInvite: AppRouteHandler<VerifyInviteRoute> = async (c) => {
  const { code } = c.req.valid('param')

  const result = await findInviteByCode(code)
  if ('error' in result) {
    throw problems.create(result.error)
  }

  c.header('Cache-Control', 'no-store, no-cache, must-revalidate')
  return c.json({ role: result.role, expiresAt: result.expiresAt.toISOString() }, codes.OK)
}

export const login: AppRouteHandler<LoginRoute> = async (c) => {
  const data = c.req.valid('json')

  const result = await verifyCredentials(data)

  if ('error' in result) {
    throw problems.create(result.error)
  }

  const accessToken = await generateAccessToken(result, env.JWT_SECRET)

  const session = await createSession(result.sub)
  const refreshToken = await generateRefreshToken(result, session.jti)

  setCookie(c, 'refreshToken', refreshToken, getRefreshTokenCookieOptions())

  return c.json({ accessToken }, codes.OK)
}

export const refresh: AppRouteHandler<RefreshRoute> = async (c) => {
  const refreshToken = getCookie(c, 'refreshToken')

  if (!refreshToken) {
    throw problems.create('UNAUTHORIZED')
  }

  const result = await verifyRefreshToken(refreshToken)

  if ('error' in result) {
    throw problems.create(result.error)
  }

  const sessionResult = await validateSession(result.jti)

  if ('error' in sessionResult) {
    throw problems.create(sessionResult.error)
  }

  // Sliding Session: Estende a sessão no banco e rotaciona o cookie
  const extensionResult = await extendSession(result.jti)
  if ('error' in extensionResult) {
    throw problems.create(extensionResult.error)
  }

  const newRefreshToken = await generateRefreshToken({
    sub: sessionResult.userId,
    role: sessionResult.user.role,
  }, result.jti)

  setCookie(c, 'refreshToken', newRefreshToken, getRefreshTokenCookieOptions())

  const accessToken = await generateAccessToken({
    sub: sessionResult.userId,
    role: sessionResult.user.role,
  }, env.JWT_SECRET)

  return c.json({ accessToken }, codes.OK)
}

export const logout: AppRouteHandler<LogoutRoute> = async (c) => {
  const refreshToken = deleteCookie(c, 'refreshToken', getRefreshTokenCookieOptions())

  if (refreshToken) {
    const result = await verifyRefreshToken(refreshToken)
    if (!('error' in result)) {
      await revokeSession(result.jti)
    }
  }

  return c.json({ message: 'Logged out successfully.' }, codes.OK)
}

export const forgotPassword: AppRouteHandler<ForgotPasswordRoute> = async (c) => {
  const { email } = c.req.valid('json')

  const result = await createPasswordResetToken(email)

  if (!('error' in result)) {
    await emailService.send({
      to: email,
      subject: 'SGDA: Password Recovery',
      template: {
        type: 'password-recovery',
        props: { resetToken: `${env.FRONTEND_URL}/reset-password?token=${result.token}` },
      },
    }, { singletonKey: `password_recovery_${email}` })
  }

  return c.json({ message: 'If the email is registered, you will receive instructions to reset your password.' }, codes.OK)
}

export const resetPassword: AppRouteHandler<ResetPasswordRoute> = async (c) => {
  const { token, newPassword } = c.req.valid('json')

  const result = await resetPasswordService(token, newPassword)

  if ('error' in result) {
    throw problems.create(result.error)
  }

  return c.json({ message: 'Password reset successfully.' }, codes.OK)
}
