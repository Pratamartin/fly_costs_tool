import type { ForgotPasswordRoute, LoginRoute, RegisterRoute, ResetPasswordRoute } from './auth.route'
import type { AppRouteHandler } from '@/lib/type'
import * as codes from 'stoker/http-status-codes'
import env from '@/env'
import { emailService } from '@/lib/email/service'
import prisma from '@/lib/orm'
import { problems } from '@/lib/problems'
import { createPasswordResetToken, generateAccessToken, resetPassword as resetPasswordService, verifyCredentials } from '@/services/auth.service'
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
    // Mapeamento específico: No registro, se o convite não existe, tratamos como código inválido (400)
    if (result.error === 'INVITE_NOT_FOUND') {
      throw problems.create('INVALID_INVITE_CODE')
    }
    throw problems.create(result.error)
  }

  return c.json(result.data, codes.CREATED)
}

export const login: AppRouteHandler<LoginRoute> = async (c) => {
  const data = c.req.valid('json')

  const result = await verifyCredentials(data)

  if ('error' in result) {
    throw problems.create(result.error)
  }

  const accessToken = await generateAccessToken(result, env.JWT_SECRET)

  return c.json({ accessToken }, codes.OK)
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
