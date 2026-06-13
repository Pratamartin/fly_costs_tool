# TESTES UNITARIOS — SPRINT 5

**Sistema:** Fly Costs Tool (SGDA)
**Ultima atualizacao:** 13/06/2026 (revisao CI)
**Framework:** Vitest 4.1.4
**Resultado geral:** 226 passed / 226 total (0 failed)

---

## Contagem de testes por arquivo

| Arquivo | Testes | Resultado |
|---|---|---|
| auth.session.test.ts | 20 | PASSOU |
| staff.notification.test.ts | 11 | PASSOU |
| **TOTAL Sprint 5** | **31** | **31 PASSOU / 0 FALHOU** |

> **Suite completa:** todos os 19 arquivos de teste passam. Os 195 testes das Sprints 1-2-3-4 continuam passando normalmente.

---

## ERRATA — Correcoes aplicadas em relacao ao rascunho inicial

| Item | Detalhe |
|---|---|
| `staff.notification.ts` importa `ajv` no module level | O arquivo `services/notifications/staff.notification.ts` faz `ajv.compile(eventJSONSchema)` no module level, o que carrega `@/lib/json-schema-validator` e executa `addFormats(ajv)`. O `ajv-formats@3.0.1` do ambiente de testes possui API incompativel, causando `TypeError: Cannot read properties of undefined (reading 'code')` em **6 arquivos** que importavam a cadeia. Corrigido com `vi.mock('@/services/notifications/staff.notification')` em cada arquivo afetado |
| `mock/env.ts` faltavam campos | O mock de env nao possuia `JWT_REFRESH_SECRET`, `REFRESH_TOKEN_EXPIRES_DAYS` e `COOKIE_SAME_SITE` — campos necessarios para as novas funcoes de sessao (`createSession`, `generateRefreshToken`, `verifyRefreshToken`, etc.). Adicionados ao mock |
| `findActiveInvite` renomeado para `findInviteByCode` | `invite.service.ts` — funcao renomeada e agora retorna `ServiceResult` em vez de `InviteCode \| null`. Testes ja usavam o nome novo; apenas comentario desatualizado corrigido |
| `isCategoryAllowedInProject` → `validateCategoryAllowedInProject` | `budget.service.ts` — funcao renomeada e agora retorna `ServiceResult` em vez de `boolean`. Testes existentes nao chamam diretamente (usam `createCostBreakdown` mockado) |
| `hasSufficientBudget` → `validateSufficientBudget` | Mesma refatoracao que a anterior — `boolean` → `ServiceResult` |
| Codigos de erro migrados para `ProblemCode` | Todos os servicos migraram de `{ error: string }` generico para `ServiceResult<T, ProblemCode>` tipado. Testes ja estavam atualizados ou usam mocks que nao dependem dos codigos |
| `EXPENSE_STATUS_TRANSITIONS` inclui `EM_PROCESSAMENTO → CONCLUIDO` | A transicao de conclusao foi adicionada, mas testes existentes usam mocks e nao dependem da constante diretamente |

---

## SPRINT 5 — Arquivos corrigidos

Os arquivos abaixo foram corrigidos para restabelecer a compatibilidade com as mudancas da Sprint 5. Nenhum teste existente foi removido ou alterado semanticamente — apenas mocks adicionados.

### Arquivos que receberam `vi.mock('@/services/notifications/staff.notification')`

| Arquivo | Motivo da falha | Testes apos correcao |
|---|---|---|
| `expense.service.test.ts` | `expense.service` agora importa `notifyStaffOnStatusChange` de `staff.notification` | 19 PASSOU |
| `attachment.service.test.ts` | Cadeia: `expense.service` → `staff.notification` → `json-schema-validator` | 8 PASSOU |
| `project-assignment.service.test.ts` | Cadeia: `expense.service` → `staff.notification` → `json-schema-validator` | 4 PASSOU |
| `report.service.test.ts` | Cadeia: `report-data.service` → `expense.service` → `staff.notification` | 19 PASSOU |
| `sprint2-flow.integration.test.ts` | Cadeia: `budget.service` → `expense.service` → `staff.notification` | 1 PASSOU |
| `sprint4-integration.test.ts` | Cadeia: `expense.service` → `staff.notification` → `json-schema-validator` | 17 PASSOU |

### Outras correcoes

| Arquivo | Mudanca |
|---|---|
| `mocks/env.ts` | Adicionados `JWT_REFRESH_SECRET`, `REFRESH_TOKEN_EXPIRES_DAYS` e `COOKIE_SAME_SITE` |
| `invite.service.test.ts` | Comentario `findActiveInvite` atualizado para `findInviteByCode` |

---

## SPRINT 5 — Testes implementados

Os arquivos abaixo foram criados nesta sprint.

---

### US 5.0 — Refresh Token e Sessao

**Arquivo:** `auth.session.test.ts` — T5.0.1 (unit)

#### createSession

```
PASSOU  cria sessao com jti, userId e expiresAt
PASSOU  usa randomUUID para gerar jti unico
PASSOU  define expiresAt para o futuro
```

Regras verificadas:
- `prisma.userSession.create` e chamado com `{ data: { jti, userId, expiresAt } }`
- `randomUUID()` de `node:crypto` gera o `jti` — mockado via `vi.mock('node:crypto')`
- `expiresAt` = `dayjs().add(env.REFRESH_TOKEN_EXPIRES_DAYS, 'day').toDate()` — 14 dias no futuro

#### generateRefreshToken

```
PASSOU  retorna string com tres partes (JWT)
PASSOU  codifica sub, role e jti no payload
PASSOU  cada chamada gera token diferente (exp diferente)
```

Regras verificadas:
- Token assinado com `env.JWT_REFRESH_SECRET` via `hono/jwt`
- Payload contem `sub`, `role`, `jti` e `exp`
- `exp` = `dayjs().add(env.REFRESH_TOKEN_EXPIRES_DAYS, 'day').unix()`

#### verifyRefreshToken

```
PASSOU  retorna payload para token valido
PASSOU  retorna UNAUTHORIZED para token invalido
PASSOU  retorna UNAUTHORIZED para token com payload malformado
```

Regras verificadas:
- Token valido: `verify(token, env.JWT_REFRESH_SECRET)` → payload decodificado e validado com `z.object({ sub, role, jti })`
- Token invalido (string aleatoria): `verify` lanca erro → `catch` retorna `{ error: 'UNAUTHORIZED' }`
- Payload malformado: `z.parse` falha → `catch` retorna `{ error: 'UNAUTHORIZED' }`

#### validateSession

```
PASSOU  retorna sessao quando jti e valido
PASSOU  retorna UNAUTHORIZED quando sessao nao existe
PASSOU  retorna UNAUTHORIZED quando sessao esta revogada
PASSOU  retorna UNAUTHORIZED quando expiresAt passou
PASSOU  retorna UNAUTHORIZED quando usuario esta inativo
PASSOU  inclui dados do usuario na sessao retornada
```

Regras verificadas:
- `prisma.userSession.findUnique({ where: { jti }, include: { user: true } })`
- Sessao valida: `!session.revokedAt && dayjs().isBefore(session.expiresAt) && session.user.isActive`
- `revokedAt != null` → rejeitado
- `expiresAt` no passado → rejeitado
- `user.isActive === false` → rejeitado
- `findUnique` retorna `null` → rejeitado

#### extendSession

```
PASSOU  atualiza expiresAt para nova data futura
PASSOU  retorna UNAUTHORIZED quando jti nao existe
```

Regras verificadas:
- `prisma.userSession.update({ where: { jti }, data: { expiresAt: newFutureDate } })`
- Prisma lanca excecao (jti inexistente) → `catch` retorna `{ error: 'UNAUTHORIZED' }`

#### revokeSession

```
PASSOU  define revokedAt na sessao
PASSOU  retorna UNAUTHORIZED quando jti nao existe
PASSOU  retorna UNAUTHORIZED quando nenhum registro e afetado
```

Regras verificadas:
- `prisma.userSession.updateMany({ where: { jti }, data: { revokedAt: new Date() } })`
- `result.count === 0` (jti inexistente) → `{ error: 'UNAUTHORIZED' }`
- `result.count === 1` → `{ success: true }`

---

### US 5.0 — Notificacao de Staff (notifyStaffOnStatusChange)

**Arquivo:** `staff.notification.test.ts` — T5.0.2 (unit)

#### notifyStaffOnStatusChange

```
PASSOU  busca staff dos cargos alvo
PASSOU  cria notificacoes in-app para cada staff
PASSOU  envia email para cada staff com template staff-notification
PASSOU  nao envia notificacao se nao houver staff do cargo alvo
PASSOU  envia notificacoes para multiplos staffs em paralelo
PASSOU  usa singletonKey unica por staff + despesa + status
PASSOU  gera actionUrl correta para ADMIN
PASSOU  gera actionUrl correta para COORDENADOR
PASSOU  propaga articleClassification no email
PASSOU  propaga projectName e categories no email
PASSOU  lida com evento invalido (fallback texto generico)
```

Regras verificadas:
- `getUsersByRoles(targetRoles, tx)` busca staff ativos dos cargos alvo
- Se `staff.length === 0`, retorna sem side effects (nem in-app, nem email)
- `createManyInAppNotifications` e chamado com `{ userIds, expenseRequestId }` — lote O(1)
- `emailService.send` e chamado **por staff** com template `staff-notification`
- `singletonKey` formato: `staff_notif_{expenseId}_{status}_{userId}` — evita duplicidade no pg-boss
- ActionUrl por role:
  - ADMIN: `/dashboard/admin/expenses/detail?id={id}`
  - COORDENADOR: `/dashboard/coordinator`
  - ALUNO: `/dashboard/student/expenses/detail/{id}` (via `ROLE_FRONTEND_SLUG`)
- `articleClassification` extraido de `expense.article.classification` (fallback: `'Nao informado'`)
- `projectName` propagado de `expense.project?.name`
- `categories` extraido de `expense.surveyAnswers[].survey.expenseCategory.name`
- Evento invalido: `validateEvent(expense.event)` retorna `false` → fallback `['Evento nao especificado']`
- `@/lib/json-schema-validator` e mockado para evitar crash do `addFormats(ajv)` no module level

---

## Resumo dos testes da Sprint 5

| User Story | ID | Tipo | Arquivo | Testes | Resultado |
|---|---|---|---|---|---|
| US 5.0 — Session e Refresh Token | T5.0.1 | unit | auth.session.test.ts | 20 | PASSOU |
| US 5.0 — Staff Notification | T5.0.2 | unit | staff.notification.test.ts | 11 | PASSOU |
| **Total Sprint 5** | | | | **31** | **31 PASSOU / 0 FALHOU** |

---

## Code Quality — Linter

O repositório possui um workflow de **Code Quality** (`.github/workflows/code-quality.yml`) que executa `eslint` em todo o `backend/`. Durante a Sprint 5, os arquivos criados/modificados abaixo geraram **25 erros de lint** no CI, todos corrigidos com `eslint --fix`:

| Arquivo | Erros | Padrão |
|---|---|---|
| `backend/src/jobs/orphan-cleanup.job.ts` | 20 | `object-curly-newline`, `antfu/if-newline`, `style/indent` |
| `backend/src/jobs/rejected-purge.job.ts` | 3 | `newline-per-chained-call`, `object-curly-newline` |
| `backend/src/lib/storage.ts` | 1 | `antfu/if-newline` |
| `backend/src/schemas/shared.schema.ts` | 1 | `object-curly-newline` |

**Recomendação:** Sempre rodar `npm run lint -- --fix` antes de commitar código novo no backend para evitar falhas no pipeline de Code Quality.

**Total geral da suite (Sprint 1 + 2 + 3 + 4 + 5):** 226 passed / 226 total — exit code 0 (CI-ready)
