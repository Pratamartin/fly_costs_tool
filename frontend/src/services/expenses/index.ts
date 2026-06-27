const API_URL = process.env.NEXT_PUBLIC_API_URL

export type ExpenseStatus = "PENDENTE" | "APROVADO" | "REJEITADO" | "EM_PROCESSAMENTO" | "EM_EDICAO" | "CONCLUIDO"

export type StudentInfo = {
  id: string
  name: string
  email?: string | null
  profile?: {
    bankCode?: string | null
    bankName?: string | null
    bankAgency?: string | null
    bankAccount?: string | null
    pixKey?: string | null
  } | null
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
  projectId?: string | null
  project?: ProjectInfo | null
  subcategory: {
    id: string
    name: string
    normalizedName: string
  }
}

export type ExpenseEvent = {
  name: string
  location: string
}

export type ExpenseArticle = {
  classification: string
}

export type ExpenseSurveyAnswer = {
  id: string
  data: unknown
  surveyId: string
}

export type Expense = {
  id: string
  title: string
  description: string | null
  status: ExpenseStatus
  rejectionReason: string | null
  correctionReason: string | null
  event: ExpenseEvent
  article: ExpenseArticle
  surveyAnswers?: ExpenseSurveyAnswer[]
  createdAt: string
  updatedAt: string
  studentId?: string
  projectId?: string | null
  attachmentKey?: string | null
  departureDate?: string | null
  returnDate?: string | null
  departureRoute?: string | null
  returnRoute?: string | null
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
  event?: ExpenseEvent
  article?: ExpenseArticle
  surveyAnswers?: Array<{ expenseCategoryId: string; data: unknown }>
}

export type UploadInvoiceError = "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "BAD_REQUEST" | "STORAGE_UNAVAILABLE" | "UNKNOWN"

export type UploadInvoiceResult =
  | { ok: true; data: Expense }
  | { ok: false; error: UploadInvoiceError }

export type UpdateExpenseResult =
  | { ok: true; data: Expense }
  | { ok: false; error: UpdateExpenseError }

export type GetExpenseResult =
  | { ok: true; data: Expense }
  | { ok: false; error: GetExpenseError }

export type CreateExpensePayload = {
  title: string
  description?: string
  event: ExpenseEvent
  article: ExpenseArticle
  surveyAnswers: Array<{ expenseCategoryId: string; data: unknown }>
}

export type ExpenseFormsData = {
  event: { schema: unknown; ui: unknown }
  article: { schema: unknown; ui: unknown }
}

export type ExpenseFormsResult =
  | { ok: true; data: ExpenseFormsData }
  | { ok: false; error: "UNAUTHORIZED" | "UNKNOWN" }

export type CreateExpenseResult =
  | { ok: true; data: Expense }
  | { ok: false; error: CreateExpenseError }

export type AssignProjectResult =
  | { ok: true; data: Expense }
  | { ok: false; error: AssignProjectError }

export type CostBreakdownPayload = {
  subcategoryName: string
  amount: number
  projectId?: string
}

export type CostBreakdownResponse = {
  id: string
  expenseRequestId: string
  amount: number
  attachmentKey?: string | null
  projectId?: string | null
  project?: { id: string; code: string; name: string } | null
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

export function mergeTravelDates(expense: Expense): Expense {
  for (const sa of expense.surveyAnswers ?? []) {
    const d = sa.data as Record<string, unknown>
    if (d && typeof d.departureDate === "string") {
      return {
        ...expense,
        departureDate: d.departureDate,
        returnDate: typeof d.returnDate === "string" ? d.returnDate : expense.returnDate,
        departureRoute: typeof d.departureRoute === "string" ? d.departureRoute : expense.departureRoute,
        returnRoute: typeof d.returnRoute === "string" ? d.returnRoute : expense.returnRoute,
      }
    }
  }
  return expense
}

export async function listExpenses(
  token: string,
  statusFilter?: ExpenseStatus,
  projectId?: string
): Promise<ListExpensesResult> {
  const params = new URLSearchParams()
  if (statusFilter) params.append("status", statusFilter)
  if (projectId) params.append("projectId", projectId)

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

export async function getExpenseForms(token: string): Promise<ExpenseFormsResult> {
  const res = await fetch(`${API_URL}/v1/expenses/forms`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 200) return { ok: true, data: await res.json() }
  if (res.status === 401) return { ok: false, error: "UNAUTHORIZED" }
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
  const body: Record<string, unknown> = {
    subcategoryName: payload.subcategoryName,
    amount: payload.amount,
  }
  if (payload.projectId) body.projectId = payload.projectId

  const res = await fetch(`${API_URL}/v1/expenses/${expenseId}/cost-breakdowns`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  if (res.status === 201) return { ok: true, data: await res.json() }
  if (res.status === 400) return { ok: false, error: "BAD_REQUEST" }
  if (res.status === 401) return { ok: false, error: "UNAUTHORIZED" }
  if (res.status === 403) return { ok: false, error: "FORBIDDEN" }
  if (res.status === 404) return { ok: false, error: "NOT_FOUND" }
  if (res.status === 409) return { ok: false, error: "CONFLICT" }
  return { ok: false, error: "UNKNOWN" }
}

export type DeleteCostBreakdownError = "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "UNKNOWN"
export type DeleteCostBreakdownResult =
  | { ok: true }
  | { ok: false; error: DeleteCostBreakdownError }

export async function deleteCostBreakdown(
  token: string,
  expenseId: string,
  breakdownId: string,
): Promise<DeleteCostBreakdownResult> {
  const res = await fetch(`${API_URL}/v1/expenses/${expenseId}/cost-breakdowns/${breakdownId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })

  if (res.status === 204) return { ok: true }
  if (res.status === 401) return { ok: false, error: "UNAUTHORIZED" }
  if (res.status === 403) return { ok: false, error: "FORBIDDEN" }
  if (res.status === 404) return { ok: false, error: "NOT_FOUND" }
  if (res.status === 409) return { ok: false, error: "CONFLICT" }
  return { ok: false, error: "UNKNOWN" }
}

export type UpdateCostBreakdownError = "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "UNKNOWN"
export type UpdateCostBreakdownResult =
  | { ok: true; data: CostBreakdownResponse }
  | { ok: false; error: UpdateCostBreakdownError }

export async function updateCostBreakdown(
  token: string,
  expenseId: string,
  breakdownId: string,
  payload: { amount?: number; projectId?: string }
): Promise<UpdateCostBreakdownResult> {
  const body: Record<string, unknown> = {}
  if (payload.amount !== undefined) body.amount = payload.amount
  if (payload.projectId !== undefined) body.projectId = payload.projectId

  const res = await fetch(`${API_URL}/v1/expenses/${expenseId}/cost-breakdowns/${breakdownId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  if (res.status === 200) return { ok: true, data: await res.json() }
  if (res.status === 401) return { ok: false, error: "UNAUTHORIZED" }
  if (res.status === 403) return { ok: false, error: "FORBIDDEN" }
  if (res.status === 404) return { ok: false, error: "NOT_FOUND" }
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

// TODO backend: endpoint POST /v1/expenses/:id/invoice precisa ser criado para suportar upload de invoice na correção
export async function uploadInvoice(
  token: string,
  expenseId: string,
  file: File
): Promise<UploadInvoiceResult> {
  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch(`${API_URL}/v1/expenses/${expenseId}/invoice`, {
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
  return { ok: false, error: "UNKNOWN" }
}

export type ReportFilters = {
  from?: string
  to?: string
  startDate?: string
  endDate?: string
  studentName?: string
  status?: ExpenseStatus | "all"
  projectId?: string
  studentId?: string
}

export type ExportReportError = "UNAUTHORIZED" | "REPORT_FAILED" | "STORAGE_UNAVAILABLE" | "UNKNOWN"

export type ExportReportResult =
  | { ok: true; downloadUrl: string }
  | { ok: false; error: ExportReportError }

const SSE_TIMEOUT_MS = 60_000

export async function exportExpensesReport(
  token: string,
  filters: ReportFilters
): Promise<ExportReportResult> {
  try {
    const params = new URLSearchParams()
    if (filters.from) params.append("from", filters.from)
    if (filters.to) params.append("to", filters.to)
    if (filters.status && filters.status !== "all") params.append("status", filters.status)
    if (filters.projectId) params.append("projectId", filters.projectId)
    if (filters.studentId) params.append("studentId", filters.studentId)

    const res = await fetch(`${API_URL}/v1/expenses/reports?${params.toString()}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    })

    if (res.status === 401) return { ok: false, error: "UNAUTHORIZED" }
    if (res.status === 503) return { ok: false, error: "STORAGE_UNAVAILABLE" }
    if (res.status !== 202) return { ok: false, error: "UNKNOWN" }

    const body = await res.json()
    const jobId: string | undefined = body?.jobId
    if (!jobId) return { ok: false, error: "UNKNOWN" }

    const sseRes = await fetch(`${API_URL}/v1/expenses/reports/status/${jobId}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
    })

    if (sseRes.status === 401) return { ok: false, error: "UNAUTHORIZED" }
    if (!sseRes.ok || !sseRes.body) return { ok: false, error: "UNKNOWN" }

    return new Promise<ExportReportResult>((resolve) => {
      const reader = sseRes.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let currentEvent = ""
      let resolved = false

      const settle = (result: ExportReportResult) => {
        if (resolved) return
        resolved = true
        reader.cancel().catch(() => {})
        resolve(result)
      }

      // Timeout: backend nunca enviou o evento
      const timeout = setTimeout(() => settle({ ok: false, error: "UNKNOWN" }), SSE_TIMEOUT_MS)

      const read = () => {
        reader.read().then(({ done, value }) => {
          if (done) {
            clearTimeout(timeout)
            settle({ ok: false, error: "UNKNOWN" })
            return
          }

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() ?? ""

          for (const line of lines) {
            if (line.startsWith("event:")) {
              currentEvent = line.slice(6).trim()
            } else if (line.startsWith("data:")) {
              const raw = line.slice(5).trim()
              if (currentEvent === "report-finished") {
                clearTimeout(timeout)
                try {
                  const data = JSON.parse(raw)
                  settle({ ok: true, downloadUrl: data.downloadUrl })
                } catch {
                  settle({ ok: false, error: "UNKNOWN" })
                }
                return
              }
              if (currentEvent === "report-error") {
                clearTimeout(timeout)
                settle({ ok: false, error: "REPORT_FAILED" })
                return
              }
              currentEvent = ""
            }
          }

          read()
        }).catch(() => {
          clearTimeout(timeout)
          settle({ ok: false, error: "UNKNOWN" })
        })
      }

      read()
    })
  } catch {
    return { ok: false, error: "UNKNOWN" }
  }
}

export type StartProcessingError = "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "UNKNOWN"

export type StartProcessingResult =
  | { ok: true; data: Expense }
  | { ok: false; error: StartProcessingError }

export async function startExpenseProcessing(
  token: string,
  expenseId: string
): Promise<StartProcessingResult> {
  const res = await fetch(`${API_URL}/v1/expenses/${expenseId}/start-processing`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  })

  if (res.status === 200) return { ok: true, data: await res.json() }
  if (res.status === 401) return { ok: false, error: "UNAUTHORIZED" }
  if (res.status === 403) return { ok: false, error: "FORBIDDEN" }
  if (res.status === 404) return { ok: false, error: "NOT_FOUND" }
  if (res.status === 409) return { ok: false, error: "CONFLICT" }
  return { ok: false, error: "UNKNOWN" }
}

export type ConcludeExpenseError = "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "UNPROCESSABLE" | "UNKNOWN"

export type ConcludeExpenseResult =
  | { ok: true; data: Expense }
  | { ok: false; error: ConcludeExpenseError }

export async function concludeExpense(
  token: string,
  expenseId: string
): Promise<ConcludeExpenseResult> {
  const res = await fetch(`${API_URL}/v1/expenses/${expenseId}/conclude`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  if (res.status === 200) return { ok: true, data: await res.json() }
  if (res.status === 401) return { ok: false, error: "UNAUTHORIZED" }
  if (res.status === 403) return { ok: false, error: "FORBIDDEN" }
  if (res.status === 404) return { ok: false, error: "NOT_FOUND" }
  if (res.status === 409) return { ok: false, error: "CONFLICT" }
  if (res.status === 422) return { ok: false, error: "UNPROCESSABLE" }
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
