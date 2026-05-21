import type { FC, PropsWithChildren } from 'hono/jsx'
import { EMAIL_THEME } from './base.layout'

type ButtonProps = PropsWithChildren<{
  href: string
}>

export const Button: FC<ButtonProps> = ({ href, children }) => {
  return (
    <div style="margin-top: 32px; text-align: center;">
      <a
        href={href}
        style={`background-color: ${EMAIL_THEME.colors.accent}; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;`}
      >
        {children}
      </a>
    </div>
  )
}
