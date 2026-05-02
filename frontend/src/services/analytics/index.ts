const API_URL = process.env.NEXT_PUBLIC_API_URL

export type AdminDashboard = {
  totalRequests: number
  byStatus: {
    PENDENTE: number
    APROVADO: number
    REJEITADO: number
    EM_PROCESSAMENTO: number
  }
  totalValue: string
  budgetCommitted: string
}

export type TopProject = {
  id: string
  name: string
  totalRequests: number
  totalValue: string
}

export type GetAdminDashboardError = "UNAUTHORIZED" | "FORBIDDEN" | "UNKNOWN"
export type GetTopProjectsError = "UNAUTHORIZED" | "FORBIDDEN" | "UNKNOWN"

export type GetAdminDashboardResult =
  | { ok: true; data: AdminDashboard }
  | { ok: false; error: GetAdminDashboardError }

export type GetTopProjectsResult =
  | { ok: true; data: TopProject[] }
  | { ok: false; error: GetTopProjectsError }

export async function getAdminDashboard(token: string): Promise<GetAdminDashboardResult> {
  const res = await fetch(`${API_URL}/v1/analytics/admin-dashboard`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  if (res.status === 200) return { ok: true, data: await res.json() }
  if (res.status === 401) return { ok: false, error: "UNAUTHORIZED" }
  if (res.status === 403) return { ok: false, error: "FORBIDDEN" }
  return { ok: false, error: "UNKNOWN" }
}

export async function getTopProjects(
  token: string,
  limit?: number
): Promise<GetTopProjectsResult> {
  const params = new URLSearchParams()
  if (limit !== undefined) params.append("limit", String(limit))

  const url = `${API_URL}/v1/analytics/top-projects${params.toString() ? `?${params.toString()}` : ""}`

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  if (res.status === 200) return { ok: true, data: await res.json() }
  if (res.status === 401) return { ok: false, error: "UNAUTHORIZED" }
  if (res.status === 403) return { ok: false, error: "FORBIDDEN" }
  return { ok: false, error: "UNKNOWN" }
}
