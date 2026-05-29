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
        Você solicitou a recuperação de sua senha no SGDA. Clique no botão abaixo para criar uma nova senha:
      </p>

      <div style="margin: 32px 0; text-align: center;">
        <a
          href={resetToken}
          style={`display: inline-block; padding: 14px 32px; background-color: ${EMAIL_THEME.colors.accent}; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 8px;`}
        >
          Redefinir minha senha
        </a>
        <p style="margin: 16px 0 0; font-size: 13px; color: #6b7280;">
          Este link expira em
          {' '}
          <strong>{expiryTime}</strong>
          .
        </p>
      </div>

      <div style="margin: 24px 0; padding: 16px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
        <p style="margin: 0 0 6px; font-size: 12px; color: #6b7280;">
          Se o botão não funcionar, copie e cole o link abaixo no navegador:
        </p>
        <span style="display: block; font-family: monospace; font-size: 12px; color: #374151; word-break: break-all;">
          {resetToken}
        </span>
      </div>

      <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
        Se você não solicitou esta alteração, por favor ignore este e-mail. Sua senha permanecerá a mesma e nenhuma ação será necessária.
      </p>

      <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #f3f4f6; text-align: center;">
        <p style="margin: 0; font-size: 13px; color: #9ca3af;">
          Por segurança, nunca compartilhe este link com ninguém. A equipe do SGDA nunca solicitará sua senha por e-mail.
        </p>
      </div>
    </BaseEmail>
  )
}
