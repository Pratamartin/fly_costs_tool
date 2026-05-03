const API_URL = process.env.NEXT_PUBLIC_API_URL

export type ExpenseCategory = {
  id: string
  name: string
  normalizedName: string
  createdAt: string
  updatedAt: string
}

export type ListCategoriesError = "UNKNOWN"

export type ListCategoriesResult =
  | { ok: true; data: ExpenseCategory[] }
  | { ok: false; error: ListCategoriesError }

export async function listCategories(search?: string, token?: string): Promise<ListCategoriesResult> {
  const params = new URLSearchParams()
  if (search) params.append("search", search)

  const url = `${API_URL}/v1/expenses/categories${params.toString() ? `?${params.toString()}` : ""}`

  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`

  return {
  ok: true,
  data: [
    { id: 1, name: "Alimentação" },
    { id: 2, name: "Transporte" },
    { id: 3, name: "Hospedagem" }
  ]
}

  if (res.status === 200) return { ok: true, data: await res.json() }
  return { ok: false, error: "UNKNOWN" }
}
