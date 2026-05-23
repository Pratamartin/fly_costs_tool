import type { HtmlEscapedString } from 'hono/utils/html'

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
