import type { FC, PropsWithChildren } from 'hono/jsx'

export const EMAIL_THEME = {
  colors: {
    primary: '#1e2d3d', // Navy
    accent: '#3b82f6', // Blue
    text: '#1f2937', // Gray 800
    muted: '#4b5563', // Gray 600
    subtle: '#6b7280', // Gray 500
    background: '#f3f4f6', // Gray 100
    card: '#ffffff',
    footer: '#f9fafb',
    border: '#e5e7eb',
  },
  spacing: {
    p: '40px',
    py: '32px',
    px: '24px',
  },
}

type BaseEmailProps = PropsWithChildren<{
  title: string
}>

export const BaseEmail: FC<BaseEmailProps> = ({ title, children }) => {
  return (
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>{title}</title>
      </head>
      <body style={`font-family: 'Inter', system-ui, -apple-system, sans-serif; line-height: 1.6; color: ${EMAIL_THEME.colors.text}; margin: 0; padding: 0; background-color: ${EMAIL_THEME.colors.background};`}>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style={`background-color: ${EMAIL_THEME.colors.background}; padding: 40px 20px;`}>
          <tr>
            <td align="center">
              <div style={`max-width: 600px; width: 100%; background-color: ${EMAIL_THEME.colors.card}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);`}>
                {/* Header/Logo Bar */}
                <div style={`background-color: ${EMAIL_THEME.colors.primary}; padding: 24px; text-align: center;`}>
                  <span style="color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: 0.05em;">SGDA</span>
                </div>

                {/* Content */}
                <div style={`padding: ${EMAIL_THEME.spacing.p};`}>
                  <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: #111827; line-height: 1.2;">
                    {title}
                  </h1>
                  <div style={`font-size: 16px; color: ${EMAIL_THEME.colors.muted};`}>
                    {children}
                  </div>
                </div>

                {/* Footer */}
                <div style={`padding: 32px 40px; background-color: ${EMAIL_THEME.colors.footer}; border-top: 1px solid ${EMAIL_THEME.colors.border}; text-align: center;`}>
                  <p style={`margin: 0; font-size: 12px; color: ${EMAIL_THEME.colors.subtle};`}>
                    Este é um e-mail automático do Sistema de Gestão de Despesas Acadêmicas (SGDA).
                  </p>
                  <p style="margin: 8px 0 0; font-size: 12px; color: #9ca3af;">
                    Por favor, não responda a este e-mail.
                  </p>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </body>
    </html>
  )
}
