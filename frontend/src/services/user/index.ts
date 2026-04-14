const API_URL = process.env.NEXT_PUBLIC_API_URL

export type UserProfile = {
  id: string
  name: string
  email: string
  role: "ALUNO" | "COORDENADOR" | "ADMIN"
  createdAt: string
  updatedAt: string
}

export type GetMeError = "UNAUTHORIZED" | "NOT_FOUND" | "UNKNOWN"

export type GetMeResult =
  | { ok: true; data: UserProfile }
  | { ok: false; error: GetMeError }

export async function getMe(token: string): Promise<GetMeResult> {
  const res = await fetch(`${API_URL}/v1/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  })

  if (res.status === 200) {
    const data = await res.json()
    return { ok: true, data }
  }
  if (res.status === 401) return { ok: false, error: "UNAUTHORIZED" }
  if (res.status === 404) return { ok: false, error: "NOT_FOUND" }
  return { ok: false, error: "UNKNOWN" }
}
