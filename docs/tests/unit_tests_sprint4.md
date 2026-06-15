# TESTES UNITARIOS — SPRINT 4

**Sistema:** Fly Costs Tool (SGDA)
**Ultima atualizacao:** 30/05/2026 (revisao CI)
**Framework:** Vitest 4.1.4
**Resultado geral:** 76 passed / 76 total (0 failed)

---

## Contagem de testes por arquivo

| Arquivo | Testes | Resultado |
|---|---|---|
| notification.service.test.ts | 13 | PASSOU |
| in-app.notification.service.test.ts | 15 | PASSOU |
| auth.reset-password.service.test.ts | 12 | PASSOU |
| report.service.test.ts | 19 | PASSOU |
| sprint4-integration.test.ts | 17 | PASSOU |
| **TOTAL Sprint 4** | **76** | **76 PASSOU / 0 FALHOU** |

> **Suite completa:** todos os 17 arquivos de teste passam. Os 119 testes das Sprints 1-2-3 continuam passando normalmente.

---

## ERRATA — Observacoes de implementacao

| Item | Detalhe |
|---|---|
| E2E Frontend (US 4.2 / 4.1 / 4.4) | Frontend nao possui runner de testes configurado (sem Jest/Vitest + React Testing Library). Os fluxos E2E de Axios interceptor, ProtectedRoute e badge de notificacao foram cobertos via testes de servico equivalentes |
| `isRead` no banco | O campo real no Prisma e `isRead` (nao `read`). O valor default `false` e definido pelo schema do banco — nao e enviado no `data` do `create` |
| `notifyStatusChange` | Funcao orquestradora em `services/notifications/index.ts` que chama `createInAppNotification` + `sendStatusChangeEmail` em sequencia |
| singletonKey do e-mail | Formato: `status_change_{expenseId}_{newStatus}` — evita duplicidade de jobs no pg-boss |
| `@aws-sdk/lib-storage` | Pacote nao estava instalado no ambiente de testes. Instalado durante a sprint 4 via `npm install` e adicionado ao `package.json` |
| `PrismaDecimal` mock incompleto | O stub em `mocks/prisma-client.ts` nao possuia `.add()`, `.toNumber()` e `.comparedTo()`. Falha so aparecia no CI (onde o Prisma real nao esta disponivel). Mock atualizado com os 3 metodos |
| `attachment.service.test.ts` / `project-assignment.service.test.ts` | Faltava `vi.mock('@/services/preference-survey.service')` — modulo carregava `ajv-formats` v3 com API incompativel. Corrigido com o mesmo padrao aplicado em `report.service.test.ts` |

---

## SPRINT 4 — Testes implementados

Os arquivos abaixo foram criados nesta sprint. Apenas os testes da Sprint 4 estao detalhados aqui.

---

### US 4.0 — Notificacao de Mudanca de Status

**Arquivo:** `notification.service.test.ts` — T4.0.1 (unit)
**Arquivo:** `sprint4-integration.test.ts` — T4.0.2 (integration)

#### T4.0.1 — sendStatusChangeEmail (notification.service.test.ts)

```
PASSOU  dispara e-mail com destinatario correto (to = e-mail do aluno)
PASSOU  assunto contem o titulo da despesa
PASSOU  template type e status-change
PASSOU  transicao APROVADO — props.newStatus e APROVADO e sem reason
PASSOU  transicao REJEITADO — props.reason recebe rejectionReason da despesa
PASSOU  transicao EM_EDICAO — props.reason recebe correctionReason da despesa
PASSOU  transicao EM_EDICAO — detailPage aponta para rota /edit/:id
PASSOU  transicoes nao-EM_EDICAO — detailPage aponta para rota /detail/:id
PASSOU  singletonKey passado como options inclui expenseId e status
PASSOU  quando usuario nao encontrado, e-mail nao e disparado
PASSOU  parametro extra sobrescreve reason calculado
PASSOU  hasMemorandum e true quando attachmentKey esta preenchido
PASSOU  hasMemorandum e false quando attachmentKey e null
```

Regras verificadas:
- `emailService.send` e mockado via `vi.hoisted` — interceptado antes do import do modulo
- Para `EM_EDICAO`: `detailPage` usa rota `/edit/:id`; demais status usam `/detail/:id`
- Para `REJEITADO`: `reason = expense.rejectionReason`; para `EM_EDICAO`: `reason = expense.correctionReason`
- Parametro `extra` tem prioridade sobre qualquer `reason` calculado internamente
- `singletonKey` formato `status_change_{id}_{status}` — garantia de idempotencia no pg-boss
- Usuario nao encontrado: `getUserById` retorna `null` → `emailService.send` nao e chamado

#### T4.0.2 — Integracao: status change → notifyStatusChange (sprint4-integration.test.ts)

```
PASSOU  PENDENTE → APROVADO dispara notifyStatusChange com userId do aluno
PASSOU  PENDENTE → REJEITADO dispara notifyStatusChange com status REJEITADO
PASSOU  transicao invalida (mesmo status PENDENTE→PENDENTE) → notifyStatusChange NAO e chamado
PASSOU  despesa nao encontrada → notifyStatusChange NAO e chamado
```

Regras verificadas:
- `notifyStatusChange` e mockado como spy via `vi.hoisted` dentro do mock de `@/services/notifications`
- Transicao invalida retorna `{ error: phrases.CONFLICT }` antes de chamar a notificacao
- `notifyStatusChangeSpy` recebe `(studentId, expense, newStatus)` — nao recebe `reason` diretamente

---

### US 4.4 — Central de Notificacoes In-App

**Arquivo:** `in-app.notification.service.test.ts` — T4.4.1 (unit)
**Arquivo:** `sprint4-integration.test.ts` — T4.4.2 (integration)

#### T4.4.1 — createInAppNotification / getUserNotifications / markAsRead / markAllAsRead (in-app.notification.service.test.ts)

```
PASSOU  chama tx.notification.create com userId e expenseRequestId corretos
PASSOU  registro criado tem isRead: false por padrao (campo nao enviado = valor default do banco)
PASSOU  sem tx explicito, usa prisma padrao
PASSOU  registros de usuarios distintos nao se mesclam — userId e preservado
PASSOU  filtra somente pelo userId autenticado
PASSOU  ordena por createdAt descendente
PASSOU  limite padrao e 20 registros
PASSOU  limit customizado respeita o parametro filters.limit
PASSOU  filtro unreadOnly=true adiciona clausula isRead: false
PASSOU  sem unreadOnly, nao filtra por isRead
PASSOU  inclui expenseRequest com campos id, title, status, updatedAt
PASSOU  atualiza isRead para true com where combinando id e userId
PASSOU  nao marca notificacao de outro usuario — where.userId isola o dono
PASSOU  atualiza todas as notificacoes nao lidas do usuario para isRead: true
PASSOU  where.userId limita atualizacao ao usuario correto
```

Regras verificadas:
- `createInAppNotification` nao envia `isRead` no `data` — o campo default `false` e definido no schema Prisma
- `getUserNotifications` usa `take: 20` como limite padrao e `orderBy: { createdAt: 'desc' }`
- `markAsRead` combina `where: { id, userId }` — impede que usuario marque notificacao alheia
- `markAllAsRead` usa `updateMany` com `where: { userId, isRead: false }` — nao altera ja lidas
- `unreadOnly: true` adiciona `isRead: false` ao `where` — sem o flag, campo nao e filtrado

#### T4.4.2 — Integracao: GET, PATCH /read, PATCH /read-all (sprint4-integration.test.ts)

```
PASSOU  GET /v1/notifications — retorna somente notificacoes do usuario autenticado
PASSOU  usuario B nao recebe notificacoes do usuario A — where.userId e respeitado
PASSOU  take maximo de 20 e aplicado por padrao
PASSOU  orderBy createdAt: desc garante ordem cronologica inversa
PASSOU  PATCH /v1/notifications/:id/read — markAsRead atualiza isRead para true
PASSOU  PATCH /v1/notifications/read-all — markAllAsRead marca todas como lidas
```

---

### US 4.1 — Recuperacao de Senha

**Arquivo:** `auth.reset-password.service.test.ts` — T4.1.1 (unit)
**Arquivo:** `sprint4-integration.test.ts` — T4.1.2 (integration)

#### T4.1.1 — createPasswordResetToken / resetPassword (auth.reset-password.service.test.ts)

```
PASSOU  o token retornado (plainToken) difere do hash salvo no banco
PASSOU  SHA-256 do plainToken corresponde ao hash salvo no banco
PASSOU  passwordResetExpiresAt e preenchido no update do banco
PASSOU  dois tokens gerados consecutivamente sao diferentes
PASSOU  e-mail inexistente retorna null sem chamar prisma.user.update
PASSOU  usuario inativo retorna null
PASSOU  token valido — retorna { success: true }
PASSOU  token valido — passwordResetToken e passwordResetExpiresAt sao limpos
PASSOU  token valido — nova senha e hasheada antes de salvar
PASSOU  token expirado/invalido — findFirst retorna null → erro INVALID_OR_EXPIRED_TOKEN
PASSOU  token ja utilizado — findFirst retorna null (token ja foi nullado) → erro
PASSOU  findFirst busca por hash SHA-256 do token recebido
```

Regras verificadas:
- `plainToken = crypto.randomBytes(32).toString('hex')` — 64 chars hex aleatorio
- Hash salvo: `crypto.createHash('sha256').update(plainToken).digest('hex')`
- `bcrypt.compare(plainPassword, savedHash)` valida a nova senha apos reset
- `passwordResetExpiresAt` e uma `Date` futura (expiracao de 1 hora por `PASSWORD_RESET_TOKEN_EXPIRES_IN_HOURS`)
- Apos reset bem-sucedido: `passwordResetToken = null`, `passwordResetExpiresAt = null`
- `findFirst` busca pelo `hash` do token (nunca pelo plain) + `expiresAt: { gt: now }`

#### T4.1.2 — Integracao: fluxo forgot → reset (sprint4-integration.test.ts)

```
PASSOU  forgot-password com e-mail valido → retorna plainToken nao nulo
PASSOU  forgot-password com e-mail inexistente → retorna null (sem vazar info)
PASSOU  reset-password com token valido → { success: true } + token limpo
PASSOU  reset-password com token invalido/expirado → retorna { error }
```

---

### US 4.2 — Protecao de Rotas e Refresh Token

**Arquivo:** `sprint4-integration.test.ts` — T4.2.1 (integration, nivel de servico)

> **Nota:** Os testes de `interceptor Axios` e `ProtectedRoute` sao exclusivamente frontend (React + Axios). O frontend nao possui runner de testes configurado neste projeto. Os cenarios abaixo cobrem o comportamento equivalente no servico de autenticacao do backend.

#### T4.2.1 — verifyCredentials / autenticacao (sprint4-integration.test.ts)

```
PASSOU  POST /auth/login com credenciais validas → retorna payload com sub e role
PASSOU  rota protegida — senha incorreta → verifyCredentials retorna null (nao autenticado)
PASSOU  usuario inativo → verifyCredentials retorna null
```

Regras verificadas:
- `verifyCredentials` retorna `{ sub: userId, role }` quando e-mail + senha batem
- Usuario com `isActive: false` retorna `null` mesmo com senha correta
- Senha incorreta: `bcrypt.compare` falha → retorno `null`
- O `accessToken` e gerado pelo `generateAccessToken` (coberto em `auth.service.test.ts`)

---

### US 4.3 — Relatorio de Despesas

**Arquivo:** `report.service.test.ts` — T4.3.1 (unit)

#### T4.3.1 — formatCurrency / extractFromSchema / formatPeriod / calculateReportAnalytics / getReportViewModel (report.service.test.ts)

```
PASSOU  formata valor numerico em BRL com simbolo R$
PASSOU  formata Prisma.Decimal corretamente
PASSOU  valor zero formata sem erro
PASSOU  valor com centavos inclui separador decimal
PASSOU  extrai campos marcados com x-report:true como textos
PASSOU  campo com format:date e classificado como data, nao texto
PASSOU  schema sem propriedades retorna arrays vazios
PASSOU  valor null no data ignora o campo
PASSOU  array vazio retorna "N/A"
PASSOU  array com uma data retorna data formatada
PASSOU  array com duas datas retorna intervalo ordenado com " - "
PASSOU  datas duplicadas sao deduplicadas
PASSOU  totalRequests e igual ao numero de despesas
PASSOU  totalAmount soma todos os costBreakdowns de todas as despesas
PASSOU  byCategory agrega corretamente por nome de categoria
PASSOU  byProject agrega por projectId com requestCount correto
PASSOU  despesa sem projeto e agrupada em "unassigned"
PASSOU  lista vazia retorna analytics zerados
PASSOU  role ALUNO forca filtro studentId = userId (visibilidade propria)
```

Regras verificadas:
- `formatCurrency` usa `Intl.NumberFormat('pt-BR', { currency: 'BRL' })` — locale e moeda definidos em `REPORT_PDF_CONFIG`
- `extractFromSchema`: so extrai campos com `'x-report': true`; campos com `format: 'date'` ou valor no formato `YYYY-MM-DD` vao para `dates[]`, demais para `texts[]`
- `formatPeriod`: datas deduplicadas e ordenadas em ordem crescente, separadas por ` - `
- `calculateReportAnalytics`: agrega `totalAmount` via `Prisma.Decimal.add`, `byCategory` e `byProject` por nome/ID
- `getReportViewModel`: ALUNO recebe visibilidade `{ studentId: userId }` — nao ve despesas alheias

---

## Resumo dos testes da Sprint 4

| User Story | ID | Tipo | Arquivo | Testes | Resultado |
|---|---|---|---|---|---|
| US 4.0 — sendStatusChangeEmail | T4.0.1 | unit | notification.service.test.ts | 13 | PASSOU |
| US 4.0 — status change integration | T4.0.2 | integration | sprint4-integration.test.ts | 4 | PASSOU |
| US 4.4 — in-app notifications | T4.4.1 | unit | in-app.notification.service.test.ts | 15 | PASSOU |
| US 4.4 — notifications integration | T4.4.2 | integration | sprint4-integration.test.ts | 6 | PASSOU |
| US 4.1 — password reset token | T4.1.1 | unit | auth.reset-password.service.test.ts | 12 | PASSOU |
| US 4.1 — forgot/reset flow | T4.1.2 | integration | sprint4-integration.test.ts | 4 | PASSOU |
| US 4.2 — auth / route protection | T4.2.1 | integration | sprint4-integration.test.ts | 3 | PASSOU |
| US 4.3 — report analytics/PDF | T4.3.1 | unit | report.service.test.ts | 19 | PASSOU |
| **Total Sprint 4** | | | | **76** | **76 PASSOU / 0 FALHOU** |

**Total geral da suite (Sprint 1 + 2 + 3 + 4):** 195 passed / 195 total — exit code 0 (CI-ready)
