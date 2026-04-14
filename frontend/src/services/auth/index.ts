const API_URL = process.env.NEXT_PUBLIC_API_URL

export type RegisterPayload = {
  name: string
  email: string
  password: string
  role: "ALUNO" | "COORDENADOR" | "ADMIN"
  inviteCode: string
}

export type RegisterError = "EMAIL_CONFLICT" | "INVALID_INVITE_CODE" | "VALIDATION_ERROR" | "UNKNOWN"

export type RegisterResult =
  | { ok: true }
  | { ok: false; error: RegisterError }

export async function register(payload: RegisterPayload): Promise<RegisterResult> {
  const res = await fetch(`${API_URL}/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (res.status === 201) return { ok: true }
  if (res.status === 409) return { ok: false, error: "EMAIL_CONFLICT" }
  if (res.status === 400) return { ok: false, error: "INVALID_INVITE_CODE" }
  if (res.status === 422) return { ok: false, error: "VALIDATION_ERROR" }
  return { ok: false, error: "UNKNOWN" }
}
