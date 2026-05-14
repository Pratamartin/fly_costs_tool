const API_URL = process.env.NEXT_PUBLIC_API_URL

export type ExpenseStatus = "PENDENTE" | "APROVADO" | "REJEITADO" | "EM_PROCESSAMENTO" | "EM_EDICAO"

export type StudentInfo = {
  id: string
  name: string
}

export type ProjectInfo = {
  id: string
  name: string
  code: string
}

export type CostBreakdown = {
  id: string
  expenseRequestId: string
  amount: number
  attachmentKey?: string | null
  subcategory: {
    id: string
    name: string
    normalizedName: string
  }
}

export type Expense = {
  id: string
  title: string
  description: string | null
  status: ExpenseStatus
  rejectionReason: string | null
  correctionNote: string | null
  city: string
  state: string
  country: string
  departureDate: string
  returnDate: string
  createdAt: string
  updatedAt: string
  studentId?: string
  projectId?: string | null
  attachmentKey?: string | null
  student?: StudentInfo
  project?: ProjectInfo | null
  costBreakdowns?: CostBreakdown[]
}

export type ListExpensesError = "UNAUTHORIZED" | "UNKNOWN"
export type UpdateExpenseStatusError = "UNAUTHORIZED" | "NOT_FOUND" | "CONFLICT" | "UNKNOWN"
export type UpdateExpenseError = "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "VALIDATION_ERROR" | "UNKNOWN"
export type GetExpenseError = "UNAUTHORIZED" | "NOT_FOUND" | "UNKNOWN"
export type CreateExpenseError = "UNAUTHORIZED" | "FORBIDDEN" | "VALIDATION_ERROR" | "UNKNOWN"
export type AssignProjectError = "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "UNKNOWN"
export type CreateCostBreakdownError = "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "BAD_REQUEST" | "CONFLICT" | "UNKNOWN"
export type UploadReceiptError = "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "BAD_REQUEST" | "STORAGE_UNAVAILABLE" | "BAD_GATEWAY" | "UNKNOWN"
export type DeleteReceiptError = "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "BAD_GATEWAY" | "UNKNOWN"
export type GetReceiptDownloadError = "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "STORAGE_UNAVAILABLE" | "BAD_GATEWAY" | "UNKNOWN"
export type UploadMemorandumError = "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "BAD_REQUEST" | "STORAGE_UNAVAILABLE" | "UNKNOWN"

export type UploadMemorandumResult =
  | { ok: true; data: Expense }
  | { ok: false; error: UploadMemorandumError }

export type ListExpensesResult =
  | { ok: true; data: Expense[] }
  | { ok: false; error: ListExpensesError }

export type UpdateExpenseStatusResult =
  | { ok: true; data: Expense }
  | { ok: false; error: UpdateExpenseStatusError }

export type UpdateExpensePayload = {
  title?: string
  description?: string
  city?: string
  state?: string
  country?: string
  departureDate?: string
  returnDate?: string
}

export type UpdateExpenseResult =
  | { ok: true; data: Expense }
  | { ok: false; error: UpdateExpenseError }

export type GetExpenseResult =
  | { ok: true; data: Expense }
  | { ok: false; error: GetExpenseError }

export type CreateExpensePayload = {
  title: string
  description?: string
  city: string
  state: string
  country?: string
  departureDate: string
  returnDate: string
}

export type CreateExpenseResult =
  | { ok: true; data: Expense }
  | { ok: false; error: CreateExpenseError }

export type AssignProjectResult =
  | { ok: true; data: Expense }
  | { ok: false; error: AssignProjectError }

export type CostBreakdownPayload = {
  subcategoryName: string
  amount: number
}

export type CostBreakdownResponse = {
  id: string
  expenseRequestId: string
  amount: number
  attachmentKey?: string | null
  subcategory: { id: string; name: string; normalizedName: string }
}

export type CreateCostBreakdownResult =
  | { ok: true; data: CostBreakdownResponse }
  | { ok: false; error: CreateCostBreakdownError }

export type UploadReceiptResult =
  | { ok: true; data: CostBreakdownResponse }
  | { ok: false; error: UploadReceiptError }

export type DeleteReceiptResult =
  | { ok: true }
  | { ok: false; error: DeleteReceiptError }

export type GetReceiptDownloadResult =
  | { ok: true; url: string; expiresIn: number }
  | { ok: false; error: GetReceiptDownloadError }

export async function listExpenses(
  token: string,
  statusFilter?: ExpenseStatus
): Promise<ListExpensesResult> {
  const params = new URLSearchParams()
  if (statusFilter) params.append("status", statusFilter)

  const url = `${API_URL}/v1/expenses${params.toString() ? `?${params.toString()}` : ""}`

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  if (res.status === 200) return { ok: true, data: await res.json() }
  if (res.status === 401) return { ok: false, error: "UNAUTHORIZED" }
  return { ok: false, error: "UNKNOWN" }
}

export async function updateExpenseStatus(
  token: string,
  expenseId: string,
  status: "APROVADO" | "REJEITADO" | "EM_EDICAO",
  reason?: string
): Promise<UpdateExpenseStatusResult> {
  const body: Record<string, string> = { status }
  if (reason) body.reason = reason

  const res = await fetch(`${API_URL}/v1/expenses/${expenseId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  if (res.status === 200) return { ok: true, data: await res.json() }
  if (res.status === 401) return { ok: false, error: "UNAUTHORIZED" }
  if (res.status === 404) return { ok: false, error: "NOT_FOUND" }
  if (res.status === 409) return { ok: false, error: "CONFLICT" }
  return { ok: false, error: "UNKNOWN" }
}

export async function getExpenseById(
  token: string,
  expenseId: string
): Promise<GetExpenseResult> {
  const res = await fetch(`${API_URL}/v1/expenses/${expenseId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  if (res.status === 200) return { ok: true, data: await res.json() }
  if (res.status === 401) return { ok: false, error: "UNAUTHORIZED" }
  if (res.status === 404) return { ok: false, error: "NOT_FOUND" }
  return { ok: false, error: "UNKNOWN" }
}

export async function createExpense(
  token: string,
  payload: CreateExpensePayload
): Promise<CreateExpenseResult> {
  const res = await fetch(`${API_URL}/v1/expenses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  if (res.status === 201) return { ok: true, data: await res.json() }
  if (res.status === 401) return { ok: false, error: "UNAUTHORIZED" }
  if (res.status === 403) return { ok: false, error: "FORBIDDEN" }
  if (res.status === 422) return { ok: false, error: "VALIDATION_ERROR" }
  return { ok: false, error: "UNKNOWN" }
}

export async function assignProject(
  token: string,
  expenseId: string,
  projectId: string
): Promise<AssignProjectResult> {
  const res = await fetch(`${API_URL}/v1/expenses/${expenseId}/assign-project`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ projectId }),
  })

  if (res.status === 200) return { ok: true, data: await res.json() }
  if (res.status === 401) return { ok: false, error: "UNAUTHORIZED" }
  if (res.status === 403) return { ok: false, error: "FORBIDDEN" }
  if (res.status === 404) return { ok: false, error: "NOT_FOUND" }
  if (res.status === 409) return { ok: false, error: "CONFLICT" }
  return { ok: false, error: "UNKNOWN" }
}

export async function createCostBreakdown(
  token: string,
  expenseId: string,
  payload: CostBreakdownPayload
): Promise<CreateCostBreakdownResult> {
  const res = await fetch(`${API_URL}/v1/expenses/${expenseId}/cost-breakdowns`, {
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
  if (res.status === 404) return { ok: false, error: "NOT_FOUND" }
  if (res.status === 409) return { ok: false, error: "CONFLICT" }
  return { ok: false, error: "UNKNOWN" }
}

export async function uploadCostBreakdownReceipt(
  token: string,
  expenseId: string,
  breakdownId: string,
  file: File
): Promise<UploadReceiptResult> {
  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch(`${API_URL}/v1/expenses/${expenseId}/cost-breakdowns/${breakdownId}/receipt`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  if (res.status === 200) return { ok: true, data: await res.json() }
  if (res.status === 400) return { ok: false, error: "BAD_REQUEST" }
  if (res.status === 401) return { ok: false, error: "UNAUTHORIZED" }
  if (res.status === 403) return { ok: false, error: "FORBIDDEN" }
  if (res.status === 404) return { ok: false, error: "NOT_FOUND" }
  if (res.status === 503) return { ok: false, error: "STORAGE_UNAVAILABLE" }
  if (res.status === 502) return { ok: false, error: "BAD_GATEWAY" }
  return { ok: false, error: "UNKNOWN" }
}

export async function deleteCostBreakdownReceipt(
  token: string,
  expenseId: string,
  breakdownId: string
): Promise<DeleteReceiptResult> {
  const res = await fetch(`${API_URL}/v1/expenses/${expenseId}/cost-breakdowns/${breakdownId}/receipt`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })

  if (res.status === 204) return { ok: true }
  if (res.status === 401) return { ok: false, error: "UNAUTHORIZED" }
  if (res.status === 403) return { ok: false, error: "FORBIDDEN" }
  if (res.status === 404) return { ok: false, error: "NOT_FOUND" }
  if (res.status === 502) return { ok: false, error: "BAD_GATEWAY" }
  return { ok: false, error: "UNKNOWN" }
}

export async function getCostBreakdownReceiptDownloadUrl(
  token: string,
  expenseId: string,
  breakdownId: string
): Promise<GetReceiptDownloadResult> {
  const res = await fetch(`${API_URL}/v1/expenses/${expenseId}/cost-breakdowns/${breakdownId}/receipt/download`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  if (res.status === 200) {
    const data = await res.json()
    return { ok: true, url: data.url, expiresIn: data.expiresIn }
  }
  if (res.status === 401) return { ok: false, error: "UNAUTHORIZED" }
  if (res.status === 403) return { ok: false, error: "FORBIDDEN" }
  if (res.status === 404) return { ok: false, error: "NOT_FOUND" }
  if (res.status === 503) return { ok: false, error: "STORAGE_UNAVAILABLE" }
  if (res.status === 502) return { ok: false, error: "BAD_GATEWAY" }
  return { ok: false, error: "UNKNOWN" }
}

export async function uploadMemorandum(
  token: string,
  expenseId: string,
  file: File
): Promise<UploadMemorandumResult> {
  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch(`${API_URL}/v1/expenses/${expenseId}/memorandum`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  if (res.status === 200) return { ok: true, data: await res.json() }
  if (res.status === 400) return { ok: false, error: "BAD_REQUEST" }
  if (res.status === 401) return { ok: false, error: "UNAUTHORIZED" }
  if (res.status === 403) return { ok: false, error: "FORBIDDEN" }
  if (res.status === 404) return { ok: false, error: "NOT_FOUND" }
  if (res.status === 409) return { ok: false, error: "CONFLICT" }
  if (res.status === 503) return { ok: false, error: "STORAGE_UNAVAILABLE" }
  return { ok: false, error: "UNKNOWN" }
}

export type GetMemorandumUrlError = "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "BAD_REQUEST" | "STORAGE_UNAVAILABLE" | "UNKNOWN"

export type GetMemorandumUrlResult =
  | { ok: true; downloadUrl: string; expiresIn: number }
  | { ok: false; error: GetMemorandumUrlError }

export async function updateExpense(
  token: string,
  expenseId: string,
  payload: UpdateExpensePayload
): Promise<UpdateExpenseResult> {
  const res = await fetch(`${API_URL}/v1/expenses/${expenseId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  if (res.status === 200) return { ok: true, data: await res.json() }
  if (res.status === 401) return { ok: false, error: "UNAUTHORIZED" }
  if (res.status === 403) return { ok: false, error: "FORBIDDEN" }
  if (res.status === 404) return { ok: false, error: "NOT_FOUND" }
  if (res.status === 422) return { ok: false, error: "VALIDATION_ERROR" }
  return { ok: false, error: "UNKNOWN" }
}

export async function getMemorandumDownloadUrl(
  token: string,
  expenseId: string
): Promise<GetMemorandumUrlResult> {
  const res = await fetch(`${API_URL}/v1/expenses/${expenseId}/memorandum/download`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  if (res.status === 200) {
    const data = await res.json()
    return { ok: true, downloadUrl: data.downloadUrl, expiresIn: data.expiresIn }
  }
  if (res.status === 400) return { ok: false, error: "BAD_REQUEST" }
  if (res.status === 401) return { ok: false, error: "UNAUTHORIZED" }
  if (res.status === 403) return { ok: false, error: "FORBIDDEN" }
  if (res.status === 404) return { ok: false, error: "NOT_FOUND" }
  if (res.status === 503) return { ok: false, error: "STORAGE_UNAVAILABLE" }
  return { ok: false, error: "UNKNOWN" }
}
