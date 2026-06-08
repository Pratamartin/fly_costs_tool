export const INVITE_STATUS = {
  ACTIVE: 'ATIVO',
  USED: 'USADO',
  EXPIRED: 'EXPIRADO',
} as const

export type InviteStatus = typeof INVITE_STATUS[keyof typeof INVITE_STATUS]

export const INVITE_EXPIRY = {
  DEFAULT_HOURS: 24,
  MIN_MINUTES: 30,
} as const

export const mockInviteCode = 'CONVITE2026'
