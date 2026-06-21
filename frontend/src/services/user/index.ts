const API_URL = process.env.NEXT_PUBLIC_API_URL

export type UserProfile = {
  id: string
  name: string
  email: string
  role: "ALUNO" | "COORDENADOR" | "ADMIN"
  isActive: boolean
  createdAt: string
  updatedAt: string
  // flattened from profile (null for non-ALUNO roles)
  cpf?: string | null
  rgPassaporte?: string | null
  birthDate?: string | null
  profession?: string | null
  address?: string | null
  bankCode?: string | null
  bankName?: string | null
  bankAgency?: string | null
  bankAccount?: string | null
}

export type UpdateProfileData = {
  name?: string
  email?: string
  cpf?: string
  rgPassaporte?: string
  birthDate?: string
  profession?: string
  address?: string
  bankCode?: string
  bankName?: string
  bankAgency?: string
  bankAccount?: string
}

export type GetMeError = "UNAUTHORIZED" | "NOT_FOUND" | "UNKNOWN"
export type GetMeResult =
  | { ok: true; data: UserProfile }
  | { ok: false; error: GetMeError }

export type UpdateProfileError = "UNAUTHORIZED" | "FORBIDDEN" | "CPF_CONFLICT" | "EMAIL_CONFLICT" | "VALIDATION_ERROR" | "UNKNOWN"
export type UpdateProfileResult =
  | { ok: true; data: UserProfile }
  | { ok: false; error: UpdateProfileError; fieldErrors?: Record<string, string> }

export async function getMe(token: string): Promise<GetMeResult> {
  const res = await fetch(`${API_URL}/v1/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  })

  if (res.status === 200) {
    const { profile, ...rest } = await res.json()
    return { ok: true, data: { ...rest, ...profile } }
  }
  if (res.status === 401) return { ok: false, error: "UNAUTHORIZED" }
  if (res.status === 404) return { ok: false, error: "NOT_FOUND" }
  return { ok: false, error: "UNKNOWN" }
}

export async function updateProfile(token: string, data: UpdateProfileData): Promise<UpdateProfileResult> {
  const res = await fetch(`${API_URL}/v1/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (res.status === 200) {
    const { profile, ...rest } = await res.json()
    return { ok: true, data: { ...rest, ...profile } }
  }
  if (res.status === 401) return { ok: false, error: "UNAUTHORIZED" }
  if (res.status === 403) return { ok: false, error: "FORBIDDEN" }
  if (res.status === 409) {
    try {
      const body = await res.json()
      if (body?.type?.includes("email")) return { ok: false, error: "EMAIL_CONFLICT" }
    } catch { /* ignore */ }
    return { ok: false, error: "CPF_CONFLICT" }
  }
  if (res.status === 400 || res.status === 422) {
    try {
      const body = await res.json()
      return { ok: false, error: "VALIDATION_ERROR", fieldErrors: body.errors }
    } catch {
      return { ok: false, error: "VALIDATION_ERROR" }
    }
  }
  return { ok: false, error: "UNKNOWN" }
}
