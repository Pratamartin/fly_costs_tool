import type { HtmlEscapedString } from 'hono/utils/html'
import crypto from 'node:crypto'

export function createEmailJobId(
  to: string,
  subject: string,
  html: string,
) {
  return crypto
    .createHash('sha256')
    .update(`${to}:${subject}:${html}`)
    .digest('hex')
}

export function redactEmail(email: string) {
  const [name, domain] = email.split('@')

  if (!name || !domain) {
    return '[invalid-email]'
  }

  return `${name[0]}***@${domain}`
}

export function renderEmailHtml(template: HtmlEscapedString | string): string {
  return `<!DOCTYPE html>\n${template.toString()}`
}
