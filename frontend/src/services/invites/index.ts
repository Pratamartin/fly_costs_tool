const API_URL = process.env.NEXT_PUBLIC_API_URL

export type InviteStatus = "ATIVO" | "USADO" | "EXPIRADO"
export type InviteRole = "ALUNO" | "COORDENADOR" | "ADMIN"

export type Invite = {
  id: string
  code: string
  role: InviteRole
  status: InviteStatus
  usedById: string | null
  usedAt: string | null
  expiresAt: string
  createdAt: string
}

export type CreateInvitePayload = {
  role: InviteRole
  expiresAt?: string
}

export type ListInvitesFilters = {
  role?: InviteRole
  status?: InviteStatus
  search?: string
}

export async function listInvites(token: string, filters?: ListInvitesFilters): Promise<Invite[]> {
  const params = new URLSearchParams()
  if (filters?.role) params.set("role", filters.role)
  if (filters?.status) params.set("status", filters.status)
  if (filters?.search) params.set("search", filters.search)

  const res = await fetch(`${API_URL}/v1/admin/invites?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Erro ao listar convites")
  return res.json()
}

export async function createInvite(token: string, payload: CreateInvitePayload): Promise<Invite> {
  const res = await fetch(`${API_URL}/v1/admin/invites`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
  if (res.status === 201) return res.json()
  const body = await res.json().catch(() => ({}))
  throw new Error(body?.message ?? "Erro ao criar convite")
}

export async function revokeInvite(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/v1/admin/invites/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 204) return
  const body = await res.json().catch(() => ({}))
  throw new Error(body?.message ?? "Erro ao revogar convite")
}

export function buildInviteLink(code: string, role: InviteRole): string {
  const base = typeof window !== "undefined" ? window.location.origin : ""
  const path = role === "ALUNO" ? "/register-student" : "/register-coordinator"
  return `${base}${path}?code=${code}`
}
