const API_URL = process.env.NEXT_PUBLIC_API_URL

export type Project = {
  id: string
  name: string
  code: string
  budget: number
  subcategories: string[]
  usedBudget: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  resourceSource?: string | null
  startDate?: string | null
  endDate?: string | null
}

export type ListProjectsError = "UNAUTHORIZED" | "FORBIDDEN" | "UNKNOWN"
export type GetProjectError = "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "UNKNOWN"
export type CreateProjectError = "UNAUTHORIZED" | "FORBIDDEN" | "BAD_REQUEST" | "CONFLICT" | "UNKNOWN"
export type UpdateProjectError = "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "BAD_REQUEST" | "CONFLICT" | "UNKNOWN"
export type DeleteProjectError = "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "UNKNOWN"

export type ListProjectsResult =
  | { ok: true; data: Project[] }
  | { ok: false; error: ListProjectsError }

export type GetProjectResult =
  | { ok: true; data: Project }
  | { ok: false; error: GetProjectError }

export type CreateProjectResult =
  | { ok: true; data: Project }
  | { ok: false; error: CreateProjectError }

export type UpdateProjectResult =
  | { ok: true; data: Project }
  | { ok: false; error: UpdateProjectError }

export type DeleteProjectResult =
  | { ok: true }
  | { ok: false; error: DeleteProjectError }

export type CreateProjectPayload = {
  name: string
  code: string
  budget: number
  subcategories: string[]
  resourceSource: string
  startDate: string
  endDate: string
}

export type UpdateProjectPayload = {
  name?: string
  code?: string
  subcategories?: string[]
}

export type ProjectCostBreakdown = {
  id: string
  amount: number
  subcategory: { id: string; name: string; normalizedName: string }
  expense: {
    id: string
    title: string
    status: string
    createdAt: string
    student?: { id: string; name: string } | null
  }
  createdAt: string
}

export type GetProjectCostBreakdownsError = "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "UNKNOWN"
export type GetProjectCostBreakdownsResult =
  | { ok: true; data: ProjectCostBreakdown[] }
  | { ok: false; error: GetProjectCostBreakdownsError }

export async function listProjects(
  token: string,
  options?: { isActive?: boolean; search?: string }
): Promise<ListProjectsResult> {
  const params = new URLSearchParams()
  if (options?.isActive !== undefined) params.append("isActive", String(options.isActive))
  if (options?.search) params.append("search", options.search)

  const url = `${API_URL}/v1/projects${params.toString() ? `?${params.toString()}` : ""}`

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

export async function getProjectById(
  token: string,
  projectId: string
): Promise<GetProjectResult> {
  const res = await fetch(`${API_URL}/v1/projects/${projectId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  if (res.status === 200) return { ok: true, data: await res.json() }
  if (res.status === 401) return { ok: false, error: "UNAUTHORIZED" }
  if (res.status === 403) return { ok: false, error: "FORBIDDEN" }
  if (res.status === 404) return { ok: false, error: "NOT_FOUND" }
  return { ok: false, error: "UNKNOWN" }
}

export async function createProject(
  token: string,
  payload: CreateProjectPayload
): Promise<CreateProjectResult> {
  const res = await fetch(`${API_URL}/v1/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  if (res.status === 201) return { ok: true, data: await res.json() }
  if (res.status === 400) return { ok: false, error: "BAD_REQUEST" }
  if (res.status === 401) return { ok: false, error: "UNAUTHORIZED" }
  if (res.status === 403) return { ok: false, error: "FORBIDDEN" }
  if (res.status === 409) return { ok: false, error: "CONFLICT" }
  return { ok: false, error: "UNKNOWN" }
}

export async function updateProject(
  token: string,
  projectId: string,
  payload: UpdateProjectPayload
): Promise<UpdateProjectResult> {
  const res = await fetch(`${API_URL}/v1/projects/${projectId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  if (res.status === 200) return { ok: true, data: await res.json() }
  if (res.status === 400) return { ok: false, error: "BAD_REQUEST" }
  if (res.status === 401) return { ok: false, error: "UNAUTHORIZED" }
  if (res.status === 403) return { ok: false, error: "FORBIDDEN" }
  if (res.status === 404) return { ok: false, error: "NOT_FOUND" }
  if (res.status === 409) return { ok: false, error: "CONFLICT" }
  return { ok: false, error: "UNKNOWN" }
}

export async function getProjectCostBreakdowns(
  token: string,
  projectId: string
): Promise<GetProjectCostBreakdownsResult> {
  const res = await fetch(`${API_URL}/v1/projects/${projectId}/cost-breakdowns`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  if (res.status === 200) return { ok: true, data: await res.json() }
  if (res.status === 401) return { ok: false, error: "UNAUTHORIZED" }
  if (res.status === 403) return { ok: false, error: "FORBIDDEN" }
  if (res.status === 404) return { ok: false, error: "NOT_FOUND" }
  return { ok: false, error: "UNKNOWN" }
}

export async function deleteProject(
  token: string,
  projectId: string
): Promise<DeleteProjectResult> {
  const res = await fetch(`${API_URL}/v1/projects/${projectId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  if (res.status === 204) return { ok: true }
  if (res.status === 401) return { ok: false, error: "UNAUTHORIZED" }
  if (res.status === 403) return { ok: false, error: "FORBIDDEN" }
  if (res.status === 404) return { ok: false, error: "NOT_FOUND" }
  return { ok: false, error: "UNKNOWN" }
}
