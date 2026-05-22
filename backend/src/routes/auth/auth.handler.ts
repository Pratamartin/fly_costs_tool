import type { ForgotPasswordRoute, LoginRoute, RegisterRoute, ResetPasswordRoute } from './auth.route'
import type { AppRouteHandler } from '@/lib/type'
import * as codes from 'stoker/http-status-codes'
import { AUTH_ERROR_CODES } from '@/constants/auth.constant'
import env from '@/env'
import { emailService } from '@/lib/email/service'
import prisma from '@/lib/orm'
import { createPasswordResetToken, generateAccessToken, resetPassword as resetPasswordService, verifyCredentials } from '@/services/auth.service'
import { findActiveInvite, validateAndConsume } from '@/services/invite.service'
import { createUser, getUserByEmail } from '@/services/user.service'

export const register: AppRouteHandler<RegisterRoute> = async (c) => {
  const data = c.req.valid('json')

  const existingUser = await getUserByEmail(data.email)
  if (existingUser) {
    return c.json({ message: 'E-mail já cadastrado' }, codes.CONFLICT)
  }

  const result = await prisma.$transaction(async (tx) => {
    const invite = await findActiveInvite(data.inviteCode, tx)
    if (!invite) {
      return { error: AUTH_ERROR_CODES.INVITE_CODE_INVALID }
    }

    const newUser = await createUser(data, env.SALT_ROUNDS, tx)

    const consumeResult = await validateAndConsume(data.inviteCode, newUser.id, tx)
    if ('error' in consumeResult) {
      return consumeResult
    }

    return { data: newUser }
  })

  if ('error' in result) {
    let message = 'Código de convite inválido ou expirado'
    if (result.error === AUTH_ERROR_CODES.INVITE_CODE_INVALID) {
      message = 'Código de convite inválido ou expirado'
    }
    return c.json({ message }, codes.BAD_REQUEST)
  }

  return c.json(result.data, codes.CREATED)
}

export const login: AppRouteHandler<LoginRoute> = async (c) => {
  const data = c.req.valid('json')

  const credentials = await verifyCredentials(data)

  if (!credentials) {
    return c.json({ message: 'E-mail ou senha inválidos' }, codes.UNAUTHORIZED)
  }

  const accessToken = await generateAccessToken(credentials, env.JWT_SECRET)

  return c.json({ accessToken }, codes.OK)
}

export const forgotPassword: AppRouteHandler<ForgotPasswordRoute> = async (c) => {
  const { email } = c.req.valid('json')

  const plainToken = await createPasswordResetToken(email)

  if (plainToken) {
    await emailService.send({
      to: email,
      subject: 'SGDA: Recuperação de Senha',
      template: {
        type: 'password-recovery',
        props: { resetToken: plainToken },
      },
    }, {
      singletonKey: `password_recovery_${email}`,
    })
  }

  return c.json({ message: 'Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.' }, codes.OK)
}

export const resetPassword: AppRouteHandler<ResetPasswordRoute> = async (c) => {
  const { token, newPassword } = c.req.valid('json')

  const result = await resetPasswordService(token, newPassword)

  if ('error' in result) {
    if (result.error === AUTH_ERROR_CODES.INVALID_OR_EXPIRED_TOKEN) {
      return c.json({ message: 'Token inválido ou expirado.' }, codes.BAD_REQUEST)
    }
    return c.json({ message: result.error }, codes.BAD_REQUEST)
  }

  return c.json({ message: 'Senha redefinida com sucesso.' }, codes.OK)
}
