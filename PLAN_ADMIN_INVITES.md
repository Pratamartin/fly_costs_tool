# Plano: Tela de Convites do Admin

**Sprint**: Sprint 3 — Frontend Part 1  
**Data**: 2026-05-11  
**Status**: Pendente  
**Branch**: `sprint3-frontend-part1`

---

## Objetivo

Criar a tela **Gerenciar Membros** (`/dashboard/admin/members`) onde o admin pode gerar e copiar links de convite para onboarding de **Alunos** e **Coordenadores** no sistema.

---

## Referência de Design

Modal "Add/Invite Member" (UX Pilot frame 27/31):

| Elemento | Comportamento |
|----------|---------------|
| Campo **E-mail** | Input para envio futuro de convite por e-mail (campo informativo por ora) |
| **Select User** | Dropdown — para futura busca de usuários existentes (stub na v1) |
| **Role** | Dropdown: `Aluno` ou `Coordenador` |
| **Permissions box** | Info contextual muda conforme o role selecionado |
| **Invite Link** | URL gerada automaticamente com o código de convite |
| **Copy Link** | Copia o link para a área de transferência |
| **Send Invite** | Botão primário (por ora apenas copia o link / exibe toast) |

---

## Estado Atual do Backend

O backend tem um mock estático em `backend/src/services/auth.service.ts`:

```ts
export const mockInviteCode = 'CONVITE2026'

export function isInviteCodeValid(inviteCode: string): boolean {
  return inviteCode === mockInviteCode
}
```

Não existe endpoint `POST /v1/invites` ainda. Estratégia:
- **v1 (esta task)**: O link gerado usa o código mock `CONVITE2026` embutido no frontend
- **v2 (sprint futura)**: Backend implementará `POST /v1/invites` → retorna `inviteCode` único → frontend chama esse endpoint

---

## Arquitetura da Solução (v1)

### Rota nova

| Rota | Arquivo |
|------|---------|
| `/dashboard/admin/members` | `frontend/src/pages/dashboard/admin/members/index.tsx` |

### Componente modal reutilizável

| Arquivo | Descrição |
|---------|-----------|
| `frontend/src/components/ModalConvite.tsx` | Modal "Add/Invite Member" |

### Serviço placeholder

| Arquivo | Função |
|---------|--------|
| `frontend/src/services/invites/index.ts` | `generateInviteLink(role)` → URL com código mock (pronto para trocar por chamada real) |

### Alteração na Sidebar

Adicionar item **"Membros"** em `AdminSidebar.tsx`:

```
Menu Principal
  ├── Painel Global        → /dashboard/admin
  ├── Projetos             → /dashboard/admin/projects
  ├── Solicitações         → /dashboard/admin/expenses
  └── Membros (novo)       → /dashboard/admin/members   ← NOVO
```

---

## Detalhes do Modal `ModalConvite`

### Props

```ts
interface ModalConviteProps {
  open: boolean
  onClose: () => void
}
```

### Estado interno

```ts
email: string            // campo informativo
role: "ALUNO" | "COORDENADOR"
inviteLink: string       // gerado localmente: `${window.location.origin}/register-student?code=CONVITE2026`
copied: boolean          // feedback visual após copiar
```

### Caixas de permissão por role

| Role | Título | Descrição |
|------|--------|-----------|
| COORDENADOR | Coordinator Permissions | Pode visualizar detalhes de projetos, aprovar ou rejeitar solicitações de despesas e gerenciar alocações de orçamento para projetos específicos |
| ALUNO | Student Permissions | Pode submeter solicitações de despesa de viagem, visualizar o status de suas solicitações e atualizar as informações do próprio perfil |

### Fluxo de "Send Invite"

```
1. Usuário seleciona role + (opcional) preenche e-mail
2. Link é gerado automaticamente ao mudar o role
3. Clica "Copy Link" ou "Send Invite"
   └─ navigator.clipboard.writeText(inviteLink)
   └─ Exibe toast "Link copiado!"
4. Fecha o modal
```

---

## Página `members/index.tsx`

Layout:
```
AdminSidebar (active="members")

┌──────────────────────────────────────────────────────┐
│ Header: "Gerenciar Membros"   [+ Convidar Membro]    │
├──────────────────────────────────────────────────────┤
│ Info card:                                           │
│  "O código de convite atual é: CONVITE2026"          │
│  "Compartilhe o link abaixo para convidar membros."  │
│                                                      │
│ Tabs: [ Aluno ] [ Coordenador ]                      │
│                                                      │
│ Link box:                                            │
│  🔗 https://…/register-student?code=CONVITE2026      │
│  [Copiar Link]                                       │
│                                                      │
│ (futuro: tabela de convites enviados / status)       │
└──────────────────────────────────────────────────────┘
```

---

## Serviço `invites/index.ts`

```ts
const MOCK_INVITE_CODE = 'CONVITE2026'

export function generateInviteLink(role: "ALUNO" | "COORDENADOR"): string {
  const base = typeof window !== 'undefined' ? window.location.origin : ''
  const path = role === 'ALUNO' ? '/register-student' : '/register-coordinator'
  return `${base}${path}?code=${MOCK_INVITE_CODE}`
}

// Placeholder para integração futura
export async function createInvite(_token: string, _role: "ALUNO" | "COORDENADOR"): Promise<string> {
  // TODO: POST /v1/invites → { inviteCode }
  return MOCK_INVITE_CODE
}
```

---

## Arquivos Criados / Alterados

| Arquivo | Tipo | O que muda |
|---------|------|------------|
| `frontend/src/pages/dashboard/admin/members/index.tsx` | Criar | Página de gerenciamento de membros |
| `frontend/src/components/ModalConvite.tsx` | Criar | Modal "Add/Invite Member" |
| `frontend/src/services/invites/index.ts` | Criar | Serviço de convites (mock v1) |
| `frontend/src/components/AdminSidebar.tsx` | Alterar | Adicionar item "Membros" ao nav |

---

## Tasks de Implementação

- [x] Criar este plano
- [x] Criar `services/invites/index.ts` com `generateInviteLink`
- [x] Criar `components/ModalConvite.tsx` fiel ao design
- [x] Criar `pages/dashboard/admin/members/index.tsx`
- [x] Adicionar "Membros" ao `AdminSidebar.tsx` (NavId + item)
- [ ] Testar cópia de link no browser
- [ ] Testar troca de role no modal (caixa de permissões muda)
- [ ] Testar navegação sidebar → /dashboard/admin/members

---

## Notas para Integração Futura (v2)

Quando o backend implementar `POST /v1/invites`:

1. `createInvite(token, role)` faz POST real e retorna `inviteCode` único
2. Remover `MOCK_INVITE_CODE` do frontend
3. Adicionar tabela de convites enviados (status: pendente / usado / expirado)
4. Considerar envio de e-mail diretamente pelo backend
