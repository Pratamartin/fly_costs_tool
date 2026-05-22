import type { FC } from 'hono/jsx'
import { PASSWORD_RESET_TOKEN_EXPIRES_IN_HOURS } from '@/constants/auth.constant'
import { BaseEmail, EMAIL_THEME } from './base.layout'

type PasswordRecoveryEmailProps = {
  resetToken: string
  expiryTime?: string
}

export const PasswordRecoveryEmail: FC<PasswordRecoveryEmailProps> = ({
  resetToken,
  expiryTime = `${PASSWORD_RESET_TOKEN_EXPIRES_IN_HOURS} ${PASSWORD_RESET_TOKEN_EXPIRES_IN_HOURS === 1 ? 'hora' : 'horas'}`,
}) => {
  return (
    <BaseEmail title="Recuperação de Senha">
      <p style="margin-top: 0;">
        Olá,
      </p>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Você solicitou a recuperação de sua senha no SGDA. Utilize o código abaixo para prosseguir com a redefinição:
      </p>

      <div style="margin: 32px 0; padding: 32px; background-color: #f9fafb; border-radius: 12px; text-align: center; border: 2px dashed #e5e7eb;">
        <span style={`display: block; font-family: monospace; font-size: 20px; font-weight: 800; color: ${EMAIL_THEME.colors.accent}; letter-spacing: 0.05em; margin-bottom: 8px; word-break: break-all;`}>
          {resetToken}
        </span>
        <p style="margin: 0; font-size: 14px; color: #6b7280;">
          Este código expira em
          {' '}
          <strong>{expiryTime}</strong>
          .
        </p>
      </div>

      <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
        Se você não solicitou esta alteração, por favor ignore este e-mail. Sua senha permanecerá a mesma e nenhuma ação será necessária.
      </p>

      <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #f3f4f6; text-align: center;">
        <p style="margin: 0; font-size: 13px; color: #9ca3af;">
          Por segurança, nunca compartilhe este código com ninguém. A equipe do SGDA nunca solicitará sua senha por e-mail.
        </p>
      </div>
    </BaseEmail>
  )
}
