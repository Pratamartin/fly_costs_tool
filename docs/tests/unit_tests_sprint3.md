# TESTES UNITARIOS — SPRINT 3

**Sistema:** Fly Costs Tool (SGDA)
**Ultima atualizacao:** 15/05/2026
**Framework:** Vitest 4.1.4
**Resultado geral:** 119 passed / 119 total (0 failed)

---

## Contagem de testes por arquivo

| Arquivo | Testes | Resultado |
|---|---|---|
| invite.service.test.ts | 21 | PASSOU |
| auth.service.test.ts | 16 | PASSOU |
| expense.service.test.ts | 19 | PASSOU |
| user.service.test.ts | 13 | PASSOU |
| storage.test.ts | 13 | PASSOU |
| attachment.service.test.ts | 8 | PASSOU |
| project.service.test.ts | 7 | PASSOU |
| analytics.service.test.ts | 6 | PASSOU |
| cost-breakdown.service.test.ts | 6 | PASSOU |
| admin-attachment.service.test.ts | 5 | PASSOU |
| project-assignment.service.test.ts | 4 | PASSOU |
| sprint2-flow.integration.test.ts | 1 | PASSOU |
| **TOTAL** | **119** | **119 PASSOU / 0 FALHOU** |

---

## ERRATA — Divergencias corrigidas em relacao ao rascunho inicial

| Campo no rascunho | Valor real no codigo |
|---|---|
| `r2.ts` / `attachment.service.ts` | `src/lib/storage.ts` — uploadFile, validatePDF, getSignedDownloadUrl, deleteFile |
| `correctionNote` | `correctionReason` (campo real no Prisma) |
| Transicao `PENDENTE -> EM_EDICAO` | Invalida. Transicao real: `APROVADO -> EM_EDICAO` (somente ADMIN) |
| Transicao `EM_EDICAO -> PENDENTE` | Invalida. Transicao real: `EM_EDICAO -> APROVADO` (aluno ao editar) |
| `auth.service.ts -> createUser` | `user.service.ts -> createUser` (auth.service so tem login e token) |
| `isInviteCodeValid` (auth.service) | @deprecated — substituto real e `findActiveInvite` em `invite.service.ts` |
| Tamanho maximo arquivo: 10 MB | Memorandos: 5 MB (PDF). Comprovantes: 10 MB (PDF/JPG/PNG) |
| Expiracao URL assinada: 15 min (memorandos) | Memorandos: 3600 s (1 h). Comprovantes: 900 s (15 min) |

---

## SPRINT 3 — Testes implementados

Os arquivos abaixo foram criados ou atualizados nesta sprint. Apenas os testes da Sprint 3 estao detalhados aqui.

---

### US 3.1 — Cadastro do aluno com dados bancarios

**Arquivo:** `user.service.test.ts` — T3.1.1 (unit)
**Arquivo:** `auth.service.test.ts` — T3.1.2 (unit)

#### T3.1.1 — createUser (user.service.test.ts)

```
PASSOU  persiste dados bancarios do aluno no profile aninhado
PASSOU  CPF duplicado — prisma.user.create lanca erro e ele e propagado
PASSOU  campos opcionais omitidos nao quebram criacao de usuario ALUNO
PASSOU  usuario ADMIN nao cria profile com dados bancarios
```

Regras verificadas:
- Para role `ALUNO`, o campo `profile.create` e preenchido com todos os dados bancarios (`bankCode`, `bankName`, `bankAgency`, `bankAccount`)
- Para role `ADMIN` ou `COORDENADOR`, `profile` nao e criado (undefined)
- Erro P2002 do Prisma (unique constraint em CPF ou email) e propagado sem tratamento no service — o handler captura e retorna 409
- Campos nulos (`cpf: null`, `bankCode: null`, etc.) sao aceitos sem erro

#### T3.1.2 — RegisterSchema (auth.service.test.ts)

```
PASSOU  aceita payload completo de ALUNO com dados bancarios
PASSOU  aceita payload de ADMIN sem dados de profile
PASSOU  aceita payload de COORDENADOR sem dados de profile
PASSOU  rejeita sem inviteCode
PASSOU  rejeita senha sem letra maiuscula
PASSOU  rejeita senha sem caractere especial
PASSOU  rejeita senha com menos de 8 caracteres
PASSOU  rejeita role invalido
PASSOU  rejeita email malformado
PASSOU  rejeita ADMIN com campos extras do profile (strict)
```

Regras verificadas:
- `RegisterSchema` e um `z.discriminatedUnion('role', [StaffRegisterSchema.strict(), AlunoRegisterSchema])`
- CPF validado com algoritmo real via `cpf-cnpj-validator` (nao apenas formato)
- Senha requer: minimo 8 chars, 1 maiuscula, 1 minuscula, 1 numero, 1 caractere especial
- `StaffRegisterSchema.strict()` rejeita qualquer campo extra (ADMIN/COORDENADOR nao podem enviar profile data)
- `inviteCode` e obrigatorio em todos os roles

---

### US 3.2 — Invite link gerado pelo Admin

**Arquivo:** `invite.service.test.ts` — T3.2.1 (unit)
**Arquivo:** `auth.service.test.ts` — T3.2.2 (unit)

#### T3.2.1 — mapInviteStatus (invite.service.test.ts)

```
PASSOU  retorna USADO quando usedById esta preenchido
PASSOU  retorna EXPIRADO quando expiresAt esta no passado e nao foi usado
PASSOU  retorna ATIVO quando valido no tempo e nao utilizado
PASSOU  USADO tem prioridade sobre EXPIRADO
```

#### T3.2.1 — createInvite (invite.service.test.ts)

```
PASSOU  gera codigo unico (8 chars hex maiusculo) e persiste no banco
PASSOU  usa expiresAt customizado quando fornecido
PASSOU  dois convites gerados possuem codigos diferentes
```

Regras verificadas:
- Codigo gerado por `crypto.randomBytes(4).toString('hex').toUpperCase()` — 8 caracteres hex
- `expiresAt` customizado e passado diretamente ao `prisma.inviteCode.create`

#### T3.2.1 — findActiveInvite (invite.service.test.ts)

```
PASSOU  retorna null quando convite nao existe
PASSOU  retorna null quando convite esta expirado
PASSOU  retorna null quando convite ja foi utilizado
PASSOU  retorna o convite quando valido e nao utilizado
```

Regras verificadas:
- Consulta `prisma.inviteCode.findUnique({ where: { code } })`
- Chama `mapInviteStatus` internamente — expirado e usado retornam null

#### T3.2.1 — validateAndConsume (invite.service.test.ts)

```
PASSOU  retorna erro quando convite e invalido
PASSOU  retorna erro quando convite esta expirado
PASSOU  retorna erro quando convite ja foi usado
PASSOU  marca convite como usado com usedById e usedAt preenchidos
```

Regras verificadas:
- Nao chama `prisma.inviteCode.update` em casos de erro
- Ao consumir: `data.usedById = userId` e `data.usedAt = new Date()`
- `where.id` usa o id do convite encontrado, nao o codigo

#### T3.2.1 — revokeInvite (invite.service.test.ts)

```
PASSOU  retorna NOT_FOUND quando convite nao existe
PASSOU  retorna ALREADY_USED quando convite ja foi utilizado
PASSOU  retorna ALREADY_EXPIRED quando convite ja esta expirado
PASSOU  revoga convite ativo setando expiresAt para agora
```

Regras verificadas:
- Convite ja consumido retorna `INVITE_ERRORS.ALREADY_USED`
- Convite ja expirado retorna `INVITE_ERRORS.ALREADY_EXPIRED`
- Revogacao seta `expiresAt` para o momento atual (nao deleta o registro)

#### T3.2.2 — isInviteCodeValid / findActiveInvite (auth.service.test.ts)

```
PASSOU  usa codigo hardcoded CONVITE2026, nao consulta o banco
PASSOU  findActiveInvite consulta o banco (substituto real do deprecated)
```

Regras verificadas:
- `isInviteCodeValid` e `@deprecated` — usa codigo hardcoded `CONVITE2026` sem consultar o banco
- O substituto real e `findActiveInvite` em `invite.service.ts`, que consulta `prisma.inviteCode.findUnique`

---

### US 3.3 — Admin Anexa Arquivos

**Arquivo:** `storage.test.ts` — T3.3.1 (unit)
**Arquivo:** `attachment.service.test.ts` — T3.3.2 (unit)

#### T3.3.1 — uploadFile (storage.test.ts)

```
PASSOU  chama PutObjectCommand com Bucket e Key corretos
PASSOU  a key gerada contem UUID e nome sanitizado do arquivo
PASSOU  retorna metadados com fileKey, fileName e fileSize
PASSOU  chama ContentType correto no PutObjectCommand
PASSOU  usa subfolder quando fornecido — key inclui expenseId no caminho
PASSOU  usa prefix quando fornecido — key contem o prefix antes do UUID
```

Regras verificadas:
- Key formato: `{folder}/{subfolder?}/{prefix?}_{uuid}-{sanitizedFileName}`
- Espacos e caracteres especiais do nome sao substituidos por `_` (regex FILENAME_SANITIZE_REGEX)
- `Bucket` sempre igual a `R2_BUCKET_NAME` da env
- `ContentType` passado diretamente para o `PutObjectCommand`
- Comprovantes de custo usam `subfolder: expenseId` — a key inclui o ID da despesa no caminho

#### T3.3.1 — getSignedDownloadUrl (storage.test.ts)

```
PASSOU  retorna URL assinada de download
PASSOU  getSignedUrl e chamado com expiresIn de 3600 segundos (padrao 1h)
PASSOU  aceita expiresIn customizado
```

Regras verificadas:
- `getSignedUrl(client, GetObjectCommand, { expiresIn })` — 3 argumentos
- Padrao de expiracao: 3600 s (1 hora) para memorandos
- Comprovantes de custo usam 900 s (15 min) — constante em `file.constant.ts`

#### T3.3.1 — validatePDF (storage.test.ts)

```
PASSOU  retorna valid:true para File com assinatura PDF valida e tamanho ok
PASSOU  retorna valid:false para arquivo sem assinatura PDF
PASSOU  retorna valid:false para arquivo maior que 5 MB (padrao)
```

Regras verificadas:
- Assinatura PDF verificada pelos primeiros 4 bytes: `%PDF` (0x25 0x50 0x44 0x46)
- Limite padrao: 5 MB (`maxSizeInMB = 5`)
- Erro de tamanho: `"Arquivo excede o tamanho maximo de 5MB"`
- Erro de formato: `"Arquivo nao e um PDF valido"`

#### T3.3.1 — deleteFile (storage.test.ts)

```
PASSOU  chama DeleteObjectCommand com Bucket e Key corretos
```

#### T3.3.2 — attachMemorandumToExpense (attachment.service.test.ts)

```
PASSOU  arquivo muito grande (>5 MB) retorna erro de tamanho
PASSOU  tipo nao permitido (nao-PDF) retorna erro de validacao
PASSOU  storage nao configurado retorna STORAGE_NOT_CONFIGURED
PASSOU  aluno sem ownership retorna FORBIDDEN
PASSOU  PDF valido faz upload com sucesso
```

Regras verificadas:
- Verificacao de `isStorageConfigured()` antes de qualquer operacao — retorna `EXPENSE_ERROR_CODES.STORAGE_NOT_CONFIGURED`
- `validatePDF(file)` e chamado antes do upload — arquivo invalido nao chega ao S3
- `expense.studentId !== userId` retorna `FORBIDDEN` — ownership obrigatorio
- Upload so acontece apos todas as validacoes passarem

#### T3.3.2 — uploadCostBreakdownReceipt (attachment.service.test.ts)

```
PASSOU  key gerada inclui expenseId como subfolder
PASSOU  storage nao configurado retorna STORAGE_NOT_CONFIGURED
PASSOU  breakdown inexistente retorna NOT_FOUND
```

Regras verificadas:
- `uploadFile` chamado com `folder: 'comprovantes'`, `subfolder: expenseId`, `prefix: category.normalizedName`
- Key resultante: `comprovantes/{expenseId}/{categoryName}_{uuid}-{filename}`
- O `expenseId` e o subfolder — garante isolamento por despesa no bucket

---

### US 3.4 / 2.7 — Status EM_EDICAO e fluxo de correcao

**Arquivo:** `expense.service.test.ts` — T3.4.1 (unit)

#### T3.4.1 — updateExpenseStatus com EM_EDICAO (expense.service.test.ts)

```
PASSOU  transicao PENDENTE -> EM_EDICAO e invalida (nao esta nas transicoes permitidas)
PASSOU  transicao APROVADO -> EM_EDICAO e valida quando role e ADMIN com motivo
PASSOU  APROVADO -> EM_EDICAO sem motivo retorna REASON_REQUIRED
PASSOU  somente ADMIN pode mover para EM_EDICAO (COORDENADOR recebe FORBIDDEN)
```

Regras verificadas (maquina de estados — `EXPENSE_STATUS_TRANSITIONS`):
- `PENDENTE` pode ir para: `APROVADO`, `REJEITADO`
- `APROVADO` pode ir para: `EM_EDICAO` (ADMIN only), `EM_PROCESSAMENTO`
- `EM_EDICAO` pode ir para: `APROVADO`
- `REJEITADO`, `EM_PROCESSAMENTO`, `CONCLUIDO`: sem transicoes validas
- `correctionReason` e obrigatorio ao mover para `EM_EDICAO` (campo `STATUSES_WHERE_REASON_REQUIRED`)
- COORDENADOR tentando mover para `EM_EDICAO` recebe erro antes de checar a maquina de estados

#### T3.4.1 — updateExpense (expense.service.test.ts)

```
PASSOU  muda status para APROVADO e limpa correctionReason apos edicao do aluno
PASSOU  aluno sem ownership recebe FORBIDDEN
PASSOU  status diferente de EM_EDICAO retorna CONFLICT
PASSOU  despesa inexistente retorna NOT_FOUND
```

Regras verificadas:
- `updateExpense` e exclusivo para o aluno dono da despesa (`studentId`)
- So funciona quando status atual e `EM_EDICAO` — qualquer outro status retorna `CONFLICT`
- Ao concluir edicao: `status -> APROVADO` e `correctionReason -> null` (limpeza automatica)
- O update nao e chamado quando qualquer validacao falha

---

### US 3.0 — Editar perfil de usuario

**Arquivo:** `user.service.test.ts` — T3.0.1 (unit)

#### T3.0.1 — updateUser (user.service.test.ts)

```
PASSOU  atualiza nome com sucesso para usuario existente
PASSOU  retorna CPF_ALREADY_USED quando CPF ja pertence a outro usuario
PASSOU  CPF igual ao atual nao dispara verificacao de duplicidade
PASSOU  salva dados bancarios completos via profile upsert
PASSOU  usuario nao encontrado retorna NOT_FOUND
```

Regras verificadas:
- `updateUser` chama `getUserById` primeiro — usuario inexistente retorna `NOT_FOUND` sem chamar o banco novamente
- CPF diferente do atual dispara `prisma.profile.findFirst({ where: { cpf, userId: { not: id } } })`
- CPF igual ao atual: verificacao de duplicidade e pulada (sem consulta extra)
- Dados bancarios salvos via `profile.upsert` (cria se nao existe, atualiza se existe)
- Somente role `ALUNO` pode ter dados de profile (`ROLES_ALLOWED_TO_HAVE_PROFILE`)

---

## Resumo dos testes da Sprint 3

| User Story | ID | Tipo | Arquivo | Testes | Resultado |
|---|---|---|---|---|---|
| US 3.1 — Cadastro com dados bancarios | T3.1.1 | unit | user.service.test.ts | 4 | PASSOU |
| US 3.1 — RegisterSchema | T3.1.2 | unit | auth.service.test.ts | 10 | PASSOU |
| US 3.2 — Invite service | T3.2.1 | unit | invite.service.test.ts | 21 | PASSOU |
| US 3.2 — isInviteCodeValid deprecated | T3.2.2 | unit | auth.service.test.ts | 2 | PASSOU |
| US 3.3 — Storage R2 | T3.3.1 | unit | storage.test.ts | 13 | PASSOU |
| US 3.3 — Attachment validation | T3.3.2 | unit | attachment.service.test.ts | 8 | PASSOU |
| US 3.4/2.7 — EM_EDICAO + updateExpense | T3.4.1 | unit | expense.service.test.ts | 8 | PASSOU |
| US 3.0 — Editar perfil | T3.0.1 | unit | user.service.test.ts | 5 | PASSOU |
| **Total Sprint 3** | | | | **71** | **71 PASSOU / 0 FALHOU** |

**Total geral da suite (Sprint 1 + 2 + 3):** 119 passed / 119 total
