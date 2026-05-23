# Plano de Implementação — US 4.4: Central de Notificações In-App

**Status:** Pendente  
**Sprint:** 4  
**Modo:** Mock (sem integração backend por enquanto)

---

## Objetivo

Adicionar uma central de notificações in-app para Admin, Coordenador e Aluno. O sino aparece no sidebar de cada role com badge de contagem de não lidas. Um dropdown exibe as últimas 20 notificações com tipo, mensagem, data e indicador lida/não lida. Clicar navega para o detalhe da despesa. Polling leve a cada 60s atualiza o contador.

---

## Arquitetura

```
services/notifications/index.ts       ← mock + contratos para integração real
hooks/useNotifications.ts             ← estado global, polling, unreadCount
components/NotificationsPanel.tsx     ← sino + badge + dropdown
components/AdminSidebar.tsx           ← recebe unreadCount, renderiza <NotificationsPanel>
components/CoordinatorSidebar.tsx     ← idem
components/StudentSidebar.tsx         ← idem
```

---

## Tipos e Contratos

```ts
// services/notifications/index.ts

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
  expenseId: string | null;   // null se não vinculada a despesa
  createdAt: string;          // ISO 8601
  readAt: string | null;      // null = não lida
}

export interface NotificationsResult {
  items: Notification[];
  unreadCount: number;
}
```

---

## Etapas de Implementação

### Etapa 1 — Serviço Mock (`services/notifications/index.ts`)

Criar o arquivo com:

- Dados mockados em memória (array estático de `Notification[]`)
- Função `listNotifications(token)` → retorna as últimas 20, ordenadas por `createdAt` desc
- Função `markAsRead(token, id)` → seta `readAt` no mock, retorna `{ ok: true }`
- Função `markAllAsRead(token)` → seta `readAt` em todas, retorna `{ ok: true }`
- Mesma assinatura de retorno discriminada usada nos outros services: `{ ok: true; data: T } | { ok: false; error: "UNKNOWN" }`
- Comentário `// TODO: substituir por fetch real para GET /v1/notifications` em cada função
- Mock com ~8 notificações variadas (todos os tipos, algumas lidas, algumas não)

Exemplo de mock seed:
```ts
const MOCK: Notification[] = [
  { id: "n1", type: "EXPENSE_APPROVED",   message: "Sua despesa #EXP-001 foi aprovada.", expenseId: "exp-001", createdAt: "2026-05-23T10:00:00Z", readAt: null },
  { id: "n2", type: "EXPENSE_REJECTED",   message: "Sua despesa #EXP-002 foi rejeitada.", expenseId: "exp-002", createdAt: "2026-05-22T14:30:00Z", readAt: "2026-05-22T15:00:00Z" },
  { id: "n3", type: "EXPENSE_PENDING_REVIEW", message: "Nova despesa aguarda sua revisão.", expenseId: "exp-003", createdAt: "2026-05-22T09:00:00Z", readAt: null },
  // ...mais 5
];
```

---

### Etapa 2 — Hook (`hooks/useNotifications.ts`)

```ts
export function useNotifications(token: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => { ... }, [token]);

  // Busca inicial + polling a cada 60s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => { ... };
  const handleMarkAllAsRead = async () => { ... };

  return { notifications, unreadCount, loading, handleMarkAsRead, handleMarkAllAsRead, refetch: fetchNotifications };
}
```

Hook encapsula todo o estado — os sidebars só recebem o resultado via props.

---

### Etapa 3 — Componente `NotificationsPanel.tsx`

**Estrutura visual:**

```
[ Sino SVG ] [ Badge vermelho com número ]
      ↓ (click abre dropdown)
┌─────────────────────────────────────────┐
│ Notificações           [Marcar todas ✓] │
├─────────────────────────────────────────┤
│ ● [ícone tipo] Mensagem curta     10min │  ← não lida (fundo levemente colorido)
│ ○ [ícone tipo] Mensagem curta      2d   │  ← lida (fundo branco/neutro)
│ ...                                     │
└─────────────────────────────────────────┘
```

**Comportamento:**
- Dropdown abre/fecha com click no sino (toggle)
- Fecha ao clicar fora (listener `mousedown` no `document`)
- Scroll interno com `max-h-96 overflow-y-auto`
- Posicionamento: `absolute` relativo ao container do sino, ajustado para não sair da tela
- Click numa notificação não lida → chama `markAsRead(id)` + `router.push(/dashboard/{role}/expenses/detail/{expenseId})` se `expenseId` existir
- Click numa notificação lida → só navega, sem chamada extra
- Badge: aparece apenas se `unreadCount > 0`, exibe "9+" quando ≥ 10
- Ícones por tipo de notificação (SVG inline, sem lib):
  - APPROVED → check verde
  - REJECTED → x vermelho
  - PENDING_REVIEW → clock amarelo
  - CORRECTION_REQUESTED → pencil laranja
  - CONCLUDED → flag verde
  - PROJECT_ASSIGNED → folder azul

**Props:**
```ts
interface NotificationsPanelProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  role: "admin" | "coordinator" | "student";
}
```

---

### Etapa 4 — Integração nos Sidebars

**Padrão por sidebar:**

```tsx
// dentro da page (ex: dashboard/admin/index.tsx)
const { notifications, unreadCount, handleMarkAsRead, handleMarkAllAsRead } = useNotifications(token);

// passado para o sidebar
<AdminSidebar
  active="dashboard"
  userName={userName}
  notifications={notifications}
  unreadCount={unreadCount}
  onMarkAsRead={handleMarkAsRead}
  onMarkAllAsRead={handleMarkAllAsRead}
/>
```

Cada sidebar renderiza `<NotificationsPanel>` em uma seção acima dos nav items (ou no header mobile).

**Posicionamento no sidebar:**
- Desktop: sino dentro do sidebar, acima da seção de navegação, alinhado à direita
- Mobile: sino no FAB ou no header fixo (definir na implementação)

**Props adicionadas a cada sidebar:**
```ts
interface AdminSidebarProps {
  // ... props existentes ...
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}
```

**Pages a atualizar (chamar `useNotifications` e passar props):**
- `pages/dashboard/admin/index.tsx`
- `pages/dashboard/admin/expenses/index.tsx`
- `pages/dashboard/admin/expenses/detail/index.tsx`
- `pages/dashboard/admin/projects/index.tsx`
- `pages/dashboard/admin/members/index.tsx`
- `pages/dashboard/coordinator/index.tsx`
- `pages/dashboard/student/index.tsx`
- `pages/dashboard/student/expenses/detail/[id].tsx`
- `pages/dashboard/profile/index.tsx`

---

### Etapa 5 — Rota de Detalhe por Role

O `NotificationsPanel` precisa saber para qual rota navegar ao clicar. Lógica:

```ts
function getExpenseDetailRoute(role: string, expenseId: string): string {
  switch (role) {
    case "admin":       return `/dashboard/admin/expenses/detail?id=${expenseId}`;
    case "coordinator": return `/dashboard/coordinator`; // coordinator usa modal, não rota dedicada
    case "student":     return `/dashboard/student/expenses/detail/${expenseId}`;
  }
}
```

---

## Preparação para Integração Real (backend)

Quando o backend estiver pronto, apenas o arquivo `services/notifications/index.ts` precisa mudar — substituir o mock por `fetch` real:

```
GET  /v1/notifications          → listNotifications
PATCH /v1/notifications/:id/read → markAsRead
PATCH /v1/notifications/read-all → markAllAsRead
```

O hook, componente e sidebars **não mudam**.

---

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---|---|
| `frontend/src/services/notifications/index.ts` | **Criar** |
| `frontend/src/hooks/useNotifications.ts` | **Criar** |
| `frontend/src/components/NotificationsPanel.tsx` | **Criar** |
| `frontend/src/components/AdminSidebar.tsx` | **Modificar** (adicionar props + renderizar painel) |
| `frontend/src/components/CoordinatorSidebar.tsx` | **Modificar** |
| `frontend/src/components/StudentSidebar.tsx` | **Modificar** |
| `frontend/src/pages/dashboard/admin/index.tsx` | **Modificar** (chamar hook, passar props) |
| `frontend/src/pages/dashboard/admin/expenses/index.tsx` | **Modificar** |
| `frontend/src/pages/dashboard/admin/expenses/detail/index.tsx` | **Modificar** |
| `frontend/src/pages/dashboard/admin/projects/index.tsx` | **Modificar** |
| `frontend/src/pages/dashboard/admin/members/index.tsx` | **Modificar** |
| `frontend/src/pages/dashboard/coordinator/index.tsx` | **Modificar** |
| `frontend/src/pages/dashboard/student/index.tsx` | **Modificar** |
| `frontend/src/pages/dashboard/student/expenses/detail/[id].tsx` | **Modificar** |
| `frontend/src/pages/dashboard/profile/index.tsx` | **Modificar** |

---

## Ordem de Execução

1. `services/notifications/index.ts` (mock + tipos)
2. `hooks/useNotifications.ts`
3. `components/NotificationsPanel.tsx`
4. `components/AdminSidebar.tsx` → `components/CoordinatorSidebar.tsx` → `components/StudentSidebar.tsx`
5. Pages (em lote — mesma alteração repetida)

---

## Critérios de Aceite

- [ ] Sino visível nos 3 sidebars (admin, coordinator, student)
- [ ] Badge exibe contagem de não lidas; some quando zerado
- [ ] Dropdown lista até 20 notificações com distinção visual lida/não lida
- [ ] Click em notificação não lida → marca como lida e navega para despesa
- [ ] Botão "Marcar todas como lidas" → zera badge
- [ ] Dropdown fecha ao clicar fora
- [ ] Polling de 60s atualiza o contador sem reload
- [ ] Sem regressão nas páginas existentes
