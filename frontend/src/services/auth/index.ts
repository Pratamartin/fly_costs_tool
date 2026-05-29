const API_URL = process.env.NEXT_PUBLIC_API_URL

export type StaffRegisterPayload = {
  name: string
  email: string
  password: string
  role: "COORDENADOR" | "ADMIN"
  inviteCode: string
}

export type AlunoRegisterPayload = {
  name: string
  email: string
  password: string
  role: "ALUNO"
  inviteCode: string
  cpf: string
  rgPassaporte: string
  birthDate: string   // "YYYY-MM-DD"
  profession: string
  address: string
  bankCode: string
  bankName: string
  bankAgency: string
  bankAccount: string
}

export type RegisterPayload = AlunoRegisterPayload | StaffRegisterPayload

export type RegisterError = "EMAIL_CONFLICT" | "INVALID_INVITE_CODE" | "VALIDATION_ERROR" | "UNKNOWN"

export type RegisterResult =
  | { ok: true }
  | { ok: false; error: RegisterError; message?: string }

export type LoginPayload = {
  email: string
  password: string
}

export type LoginError = "INVALID_CREDENTIALS" | "VALIDATION_ERROR" | "UNKNOWN"

export type LoginResult =
  | { ok: true; accessToken: string }
  | { ok: false; error: LoginError }

export async function register(payload: RegisterPayload): Promise<RegisterResult> {
  const res = await fetch(`${API_URL}/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (res.status === 201) return { ok: true }
  if (res.status === 409) return { ok: false, error: "EMAIL_CONFLICT" }
  if (res.status === 400) return { ok: false, error: "INVALID_INVITE_CODE" }
  if (res.status === 422) {
    const body = await res.json().catch(() => ({}))
    return { ok: false, error: "VALIDATION_ERROR", message: body?.message }
  }
  return { ok: false, error: "UNKNOWN" }
}

export async function login(payload: LoginPayload): Promise<LoginResult> {
  const res = await fetch(`${API_URL}/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (res.status === 200) {
    const data = await res.json()
    return { ok: true, accessToken: data.accessToken }
  }
  if (res.status === 401) return { ok: false, error: "INVALID_CREDENTIALS" }
  if (res.status === 422) return { ok: false, error: "VALIDATION_ERROR" }
  return { ok: false, error: "UNKNOWN" }
}

export type ForgotPasswordResult =
  | { ok: true }
  | { ok: false; error: "VALIDATION_ERROR" | "UNKNOWN" }

export type ResetPasswordError = "TOKEN_EXPIRED" | "TOKEN_INVALID" | "VALIDATION_ERROR" | "UNKNOWN"

export type ResetPasswordResult =
  | { ok: true }
  | { ok: false; error: ResetPasswordError }

export async function forgotPassword(email: string): Promise<ForgotPasswordResult> {
  const res = await fetch(`${API_URL}/v1/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  })

  if (res.status === 200) return { ok: true }
  if (res.status === 422) return { ok: false, error: "VALIDATION_ERROR" }
  return { ok: false, error: "UNKNOWN" }
}

export async function resetPassword(token: string, newPassword: string): Promise<ResetPasswordResult> {
  const res = await fetch(`${API_URL}/v1/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  })

  if (res.status === 200) return { ok: true }
  if (res.status === 400) {
    const body = await res.json().catch(() => ({}))
    const error = body?.error === "TOKEN_EXPIRED" ? "TOKEN_EXPIRED"
      : body?.error === "TOKEN_INVALID" ? "TOKEN_INVALID"
      : "UNKNOWN"
    return { ok: false, error }
  }
  if (res.status === 422) return { ok: false, error: "VALIDATION_ERROR" }
  return { ok: false, error: "UNKNOWN" }
}
