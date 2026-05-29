const API_URL = process.env.NEXT_PUBLIC_API_URL

export type NotificationType =
  | "EXPENSE_APPROVED"
  | "EXPENSE_REJECTED"
  | "EXPENSE_PENDING_REVIEW"
  | "EXPENSE_CORRECTION_REQUESTED"
  | "EXPENSE_CONCLUDED"
  | "PROJECT_ASSIGNED";

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  expenseId: string | null;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationsResult {
  items: Notification[];
  unreadCount: number;
}

type NotifResult<T> = { ok: true; data: T } | { ok: false; error: "UNAUTHORIZED" | "UNKNOWN" };

type ExpenseStatus =
  | "PENDENTE"
  | "APROVADO"
  | "REJEITADO"
  | "EM_EDICAO"
  | "CONCLUIDO"
  | "EM_PROCESSAMENTO"

interface BackendNotification {
  id: string
  userId: string | null
  expenseRequestId: string | null
  isRead: boolean
  createdAt: string
  expenseRequest: {
    id: string
    title: string
    status: ExpenseStatus
    updatedAt: string
  } | null
}

const STATUS_TYPE_MAP: Record<ExpenseStatus, NotificationType> = {
  PENDENTE: "EXPENSE_PENDING_REVIEW",
  APROVADO: "EXPENSE_APPROVED",
  REJEITADO: "EXPENSE_REJECTED",
  EM_EDICAO: "EXPENSE_CORRECTION_REQUESTED",
  CONCLUIDO: "EXPENSE_CONCLUDED",
  EM_PROCESSAMENTO: "PROJECT_ASSIGNED",
}

const STATUS_MESSAGE_MAP: Record<ExpenseStatus, (title: string) => string> = {
  PENDENTE: (t) => `Sua despesa "${t}" está aguardando revisão.`,
  APROVADO: (t) => `Sua despesa "${t}" foi aprovada.`,
  REJEITADO: (t) => `Sua despesa "${t}" foi rejeitada.`,
  EM_EDICAO: (t) => `Sua despesa "${t}" precisa de correções.`,
  CONCLUIDO: (t) => `Sua despesa "${t}" foi concluída e processada.`,
  EM_PROCESSAMENTO: (t) => `Sua despesa "${t}" foi vinculada a um projeto.`,
}

function transformNotification(n: BackendNotification): Notification {
  const status = n.expenseRequest?.status
  const title = n.expenseRequest?.title ?? "Despesa"

  return {
    id: n.id,
    type: status ? STATUS_TYPE_MAP[status] : "EXPENSE_PENDING_REVIEW",
    message: status ? STATUS_MESSAGE_MAP[status](title) : `Atualização na despesa "${title}".`,
    expenseId: n.expenseRequestId,
    createdAt: n.createdAt,
    readAt: n.isRead ? (n.expenseRequest?.updatedAt ?? n.createdAt) : null,
  }
}

export async function listNotifications(token: string): Promise<NotifResult<NotificationsResult>> {
  try {
    const res = await fetch(`${API_URL}/v1/notifications?limit=20`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (res.status === 401) return { ok: false, error: "UNAUTHORIZED" }
    if (!res.ok) return { ok: false, error: "UNKNOWN" }

    const raw: BackendNotification[] = await res.json()
    const items = raw.map(transformNotification)
    const unreadCount = items.filter((n) => n.readAt === null).length

    return { ok: true, data: { items, unreadCount } }
  } catch {
    return { ok: false, error: "UNKNOWN" }
  }
}

export async function markAsRead(token: string, id: string): Promise<NotifResult<void>> {
  try {
    const res = await fetch(`${API_URL}/v1/notifications/${id}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    })

    if (res.status === 401) return { ok: false, error: "UNAUTHORIZED" }
    if (res.status === 200 || res.status === 404) return { ok: true, data: undefined }
    return { ok: false, error: "UNKNOWN" }
  } catch {
    return { ok: false, error: "UNKNOWN" }
  }
}

export async function markAllAsRead(token: string): Promise<NotifResult<void>> {
  try {
    const res = await fetch(`${API_URL}/v1/notifications/read-all`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    })

    if (res.status === 401) return { ok: false, error: "UNAUTHORIZED" }
    if (res.status === 200) return { ok: true, data: undefined }
    return { ok: false, error: "UNKNOWN" }
  } catch {
    return { ok: false, error: "UNKNOWN" }
  }
}
