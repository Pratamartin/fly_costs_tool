const API_URL = process.env.NEXT_PUBLIC_API_URL

export type SurveyCategory = {
  name: string
  normalizedName: string
}

export type Survey = {
  id: string
  schema: Record<string, unknown>
  ui: Record<string, unknown> | null
  version: number
  isActive: boolean
  expenseCategoryId: string
  expenseCategory: SurveyCategory
  createdAt: string
  updatedAt: string
}

export type SurveyAnswer = {
  expenseCategoryId: string
  data: unknown
}

type SurveyResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: "UNAUTHORIZED" | "BAD_GATEWAY" | "UNKNOWN" }

export async function listSurveys(token: string): Promise<SurveyResult<Survey[]>> {
  const res = await fetch(`${API_URL}/v1/preference-surveys`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 200) return { ok: true, data: await res.json() }
  if (res.status === 401) return { ok: false, error: "UNAUTHORIZED" }
  return { ok: false, error: "UNKNOWN" }
}

export async function uploadSurveyFile(
  token: string,
  file: File,
): Promise<SurveyResult<{ fileKey: string; fileName: string }>> {
  const body = new FormData()
  body.append("file", file)
  const res = await fetch(`${API_URL}/v1/preference-surveys/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
  })
  if (res.status === 200) return { ok: true, data: await res.json() }
  if (res.status === 401) return { ok: false, error: "UNAUTHORIZED" }
  if (res.status === 502) return { ok: false, error: "BAD_GATEWAY" }
  return { ok: false, error: "UNKNOWN" }
}

export async function getSurveyDownloadUrl(
  token: string,
  fileKey: string,
): Promise<SurveyResult<{ downloadUrl: string; expiresIn: number }>> {
  const params = new URLSearchParams({ fileKey })
  const res = await fetch(`${API_URL}/v1/preference-surveys/download?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 200) return { ok: true, data: await res.json() }
  if (res.status === 401) return { ok: false, error: "UNAUTHORIZED" }
  return { ok: false, error: "UNKNOWN" }
}
