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

type NotifResult<T> = { ok: true; data: T } | { ok: false; error: "UNKNOWN" };

// In-memory mock store — substitua cada função por fetch real quando o backend estiver pronto
let MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "EXPENSE_APPROVED",
    message: "Sua despesa de viagem para São Paulo foi aprovada.",
    expenseId: "exp-001",
    createdAt: "2026-05-23T10:00:00Z",
    readAt: null,
  },
  {
    id: "n2",
    type: "EXPENSE_REJECTED",
    message: "Sua despesa de hospedagem foi rejeitada. Verifique o motivo.",
    expenseId: "exp-002",
    createdAt: "2026-05-22T14:30:00Z",
    readAt: "2026-05-22T15:00:00Z",
  },
  {
    id: "n3",
    type: "EXPENSE_PENDING_REVIEW",
    message: "Nova solicitação de despesa aguarda sua revisão.",
    expenseId: "exp-003",
    createdAt: "2026-05-22T09:00:00Z",
    readAt: null,
  },
  {
    id: "n4",
    type: "PROJECT_ASSIGNED",
    message: "Sua despesa foi vinculada ao projeto FAPESP-2024.",
    expenseId: "exp-004",
    createdAt: "2026-05-21T16:45:00Z",
    readAt: null,
  },
  {
    id: "n5",
    type: "EXPENSE_CORRECTION_REQUESTED",
    message: "Corrija os dados da despesa de hospedagem enviada.",
    expenseId: "exp-005",
    createdAt: "2026-05-21T11:20:00Z",
    readAt: "2026-05-21T13:00:00Z",
  },
  {
    id: "n6",
    type: "EXPENSE_CONCLUDED",
    message: "Sua despesa de passagem aérea foi concluída e processada.",
    expenseId: "exp-006",
    createdAt: "2026-05-20T08:00:00Z",
    readAt: "2026-05-20T09:15:00Z",
  },
  {
    id: "n7",
    type: "EXPENSE_PENDING_REVIEW",
    message: "2 novas solicitações aguardam aprovação urgente.",
    expenseId: null,
    createdAt: "2026-05-19T17:30:00Z",
    readAt: null,
  },
  {
    id: "n8",
    type: "EXPENSE_APPROVED",
    message: "Despesa de alimentação referente à conferência foi aprovada.",
    expenseId: "exp-008",
    createdAt: "2026-05-18T14:00:00Z",
    readAt: "2026-05-18T15:30:00Z",
  },
];

// TODO: substituir por fetch real → GET /v1/notifications
export async function listNotifications(_token: string): Promise<NotifResult<NotificationsResult>> {
  try {
    const sorted = [...MOCK_NOTIFICATIONS].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const items = sorted.slice(0, 20);
    const unreadCount = items.filter((n) => n.readAt === null).length;
    return { ok: true, data: { items, unreadCount } };
  } catch {
    return { ok: false, error: "UNKNOWN" };
  }
}

// TODO: substituir por fetch real → PATCH /v1/notifications/:id/read
export async function markAsRead(_token: string, id: string): Promise<NotifResult<void>> {
  try {
    MOCK_NOTIFICATIONS = MOCK_NOTIFICATIONS.map((n) =>
      n.id === id ? { ...n, readAt: new Date().toISOString() } : n
    );
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, error: "UNKNOWN" };
  }
}

// TODO: substituir por fetch real → PATCH /v1/notifications/read-all
export async function markAllAsRead(_token: string): Promise<NotifResult<void>> {
  try {
    const now = new Date().toISOString();
    MOCK_NOTIFICATIONS = MOCK_NOTIFICATIONS.map((n) =>
      n.readAt === null ? { ...n, readAt: now } : n
    );
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, error: "UNKNOWN" };
  }
}
