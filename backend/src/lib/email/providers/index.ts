import type { EmailProvider } from '../type'
import env from '@/env'
import { EtherealProvider } from './ethereal.provider'
import { GmailProvider } from './gmail.provider'

let cachedProvider: EmailProvider | null = null

export function createEmailProvider(): EmailProvider {
  if (cachedProvider) {
    return cachedProvider
  }

  const isGmailEnabled = Boolean(
    env.GOOGLE_EMAIL
    && env.GOOGLE_REFRESH_TOKEN,
  )

  if (isGmailEnabled) {
    cachedProvider = new GmailProvider({
      from: env.GOOGLE_EMAIL!,
      clientId: env.GOOGLE_CLIENT_ID!,
      clientSecret: env.GOOGLE_CLIENT_SECRET!,
      redirectUri: env.GOOGLE_REDIRECT_URI!,
      refreshToken: env.GOOGLE_REFRESH_TOKEN!,
    })
  }
  else if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') {
    cachedProvider = new EtherealProvider()
  }
  else {
    throw new Error(`Email provider is not configured for environment: ${env.NODE_ENV}. Gmail credentials are required.`)
  }

  return cachedProvider
}
