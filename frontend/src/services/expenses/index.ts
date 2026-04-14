const API_URL = process.env.NEXT_PUBLIC_API_URL

export type ExpenseStatus = "PENDENTE" | "APROVADO" | "REJEITADO"
export type ExpenseTopic = "INSCRICAO" | "PASSAGEM" | "HOSPEDAGEM"

export type StudentInfo = {
  id: string
  name: string
}

export type ProjectInfo = {
  id: string
  name: string
}

export type Expense = {
  id: string
  title: string
  amount: string
  status: ExpenseStatus
  topic: ExpenseTopic
  createdAt: string
  updatedAt: string
  student?: StudentInfo
  project?: ProjectInfo | null
  description?: string
}

export type ListExpensesError = "UNAUTHORIZED" | "UNKNOWN"
export type UpdateExpenseStatusError = "UNAUTHORIZED" | "NOT_FOUND" | "CONFLICT" | "UNKNOWN"

export type ListExpensesResult =
  | { ok: true; data: Expense[] }
  | { ok: false; error: ListExpensesError }

export type UpdateExpenseStatusResult =
  | { ok: true; data: Expense }
  | { ok: false; error: UpdateExpenseStatusError }

export async function listExpenses(
  token: string,
  statusFilter?: ExpenseStatus
): Promise<ListExpensesResult> {
  const params = new URLSearchParams()
  if (statusFilter) {
    params.append("status", statusFilter)
  }

  const url = `${API_URL}/v1/expenses${params.toString() ? `?${params.toString()}` : ""}`

  const res = await fetch(url, {
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
  return { ok: false, error: "UNKNOWN" }
}

export async function updateExpenseStatus(
  token: string,
  expenseId: string,
  status: "APROVADO" | "REJEITADO"
): Promise<UpdateExpenseStatusResult> {
  const res = await fetch(`${API_URL}/v1/expenses/${expenseId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  })

  if (res.status === 200) {
    const data = await res.json()
    return { ok: true, data }
  }
  if (res.status === 401) return { ok: false, error: "UNAUTHORIZED" }
  if (res.status === 404) return { ok: false, error: "NOT_FOUND" }
  if (res.status === 409) return { ok: false, error: "CONFLICT" }
  return { ok: false, error: "UNKNOWN" }
}
