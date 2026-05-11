const MOCK_INVITE_CODE = 'CONVITE2026'

export function generateInviteLink(role: "ALUNO" | "COORDENADOR"): string {
  const base = typeof window !== 'undefined' ? window.location.origin : ''
  const path = role === 'ALUNO' ? '/register-student' : '/register-coordinator'
  return `${base}${path}?code=${MOCK_INVITE_CODE}`
}

// Placeholder para integração futura com POST /v1/invites
export async function createInvite(_token: string, _role: "ALUNO" | "COORDENADOR"): Promise<string> {
  return MOCK_INVITE_CODE
}
