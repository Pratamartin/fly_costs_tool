import type { EmailProvider } from '../type'
import env from '@/env'
import { EtherealProvider } from './ethereal.provider'
import { GmailProvider } from './gmail.provider'

export function createEmailProvider(): EmailProvider {
  const isGmailEnabled = Boolean(
    env.GOOGLE_EMAIL
    && env.GOOGLE_REFRESH_TOKEN,
  )

  if (isGmailEnabled) {
    return new GmailProvider({
      from: env.GOOGLE_EMAIL!,
      clientId: env.GOOGLE_CLIENT_ID!,
      clientSecret: env.GOOGLE_CLIENT_SECRET!,
      redirectUri: env.GOOGLE_REDIRECT_URI!,
      refreshToken: env.GOOGLE_REFRESH_TOKEN!,
    })
  }

  if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') {
    return new EtherealProvider()
  }

  throw new Error(`Email provider is not configured for environment: ${env.NODE_ENV}. Gmail credentials are required.`)
}
