# TESTES UNITARIOS — SPRINT 6

**Sistema:** Fly Costs Tool (SGDA)
**Framework:** Vitest 4.1.4
**Resultado da Sprint 6:** 155 passed / 0 failed / 155 total


---

## Contagem de testes por arquivo (Escopo da Sprint 6)

| Arquivo | Testes | Resultado |
|---|---|---|
| sprint2-flow.integration.test.ts | 14 | PASSOU |
| analytics.service.test.ts | 9 | PASSOU |
| attachment.service.test.ts | 12 | PASSOU |
| auth.service.test.ts | 10 | PASSOU |
| project-assignment.service.test.ts | 8 | PASSOU |
| report.service.test.ts | 19 | PASSOU |
| projects.spec.ts | 15 | PASSOU |
| validations.spec.ts | 6 | PASSOU |
| admin-dashboard.spec.ts | 4 | PASSOU |
| top-projects.spec.ts | 4 | PASSOU |
| conclusion-flow.spec.ts | 3 | PASSOU |
| correction-flow.spec.ts | 3 | PASSOU |
| deletion.spec.ts | 5 | PASSOU |
| preference-survey.schema.test.ts | 12 | PASSOU |
| update.spec.ts | 17 | PASSOU |
| reports.spec.ts | 7 | PASSOU |
| invalid-transitions.spec.ts | 6 | PASSOU |
| archived-project.spec.ts | 1 | PASSOU |

---

## ERRATA — Observações de implementação

| Item | Detalhe |
|---|---|
| Refatoração de Asserções (Sprint 2 Flow) | Devido à migração do modelo (Projetos agora pertencem a *CostBreakdowns* e não à *Despesa Raiz*), os testes do arquivo `sprint2-flow.integration.test.ts` foram reescritos. As expectativas agora buscam o ID do projeto em `viewed.costBreakdowns[0].project.id`. |
| Prisma Mock (`analytics.service`) | A função de `budgetCommitted` passou a iterar sobre quebras de custo "Em Processamento". Precisamos atualizar os *stubs* do Prisma-mock no Vitest para injetar `costBreakdown.aggregate` e lidar adequadamente com tipagens `Prisma.Decimal`. |
| S3/R2 Attachments | A nomenclatura de chaves no `attachment.service` agora utiliza o UUID do *CostBreakdown* (ex: `breakdown-123_file.jpg`) em vez do nome da categoria, impedindo colisão de arquivos. Os mocks dos testes unitários foram atualizados para não quebrar. |
| Obrigatoriedade da `pixKey` | O schema relacional de Estudantes passou a exigir a chave Pix. Os payloads sintéticos dos testes de Autenticação e Registro precisaram ser atualizados, caso contrário, falhariam precocemente via validação do Zod (422 Unprocessable Entity). |
| Teardowns (`RESTRICT` Violations) | Os testes de deleção e CRUD de Projetos sofriam erro de FK no `afterAll()`. A deleção foi estabilizada respeitando a ordem de cascata relacional entre `CostBreakdowns` e `Projects` no banco de dados isolado dos testes. |

---

## SPRINT 6 — Testes implementados

Os arquivos abaixo foram criados ou refatorados nesta sprint. Apenas os testes da Sprint 6 estão detalhados aqui.

---

### US 6.0 — Arquitetura de CostBreakdowns, Atualização e Isolação 1:N

**Arquivos:** `project-assignment.service.test.ts`, `top-projects.spec.ts`, `admin-dashboard.spec.ts`, `update.spec.ts`, `archived-project.spec.ts`

```text
PASSOU  migra bloqueio de verba (PROJECT_INSUFFICIENT_FUNDS) para a camada de rateio individual
PASSOU  ranking do dashboard agora soma allocations via costBreakdowns e não na despesa global
PASSOU  valida update de saldo bloqueando extrapolação do budget do projeto (update.spec)
PASSOU  transferência Cross-Project via PATCH /cost-breakdowns/:breakdownId
PASSOU  bloqueia edição caso projeto destino esteja arquivado ou com vigência expirada
```

**Regras verificadas:**
- Uma mesma despesa pode ter itens custeados por múltiplos projetos de forma isolada. A associação via chave estrangeira ocorre granularmente na tabela `CostBreakdown`.
- O cálculo financeiro no Admin Dashboard garante precisão iterando um `.reduce()` exclusivamente em `costBreakdowns` "Em Processamento", impedindo vazamento de saldo ou relatórios estatísticos inflados se a solicitação mãe for rateada de forma mista.
- Funcionalidade de Edição (Update Plan) totalmente coberta: Transferências financeiras entre centros de custo (projetos) garantem a validação estrita da verba restante do projeto destino, com bloqueios diretos via validação relacional e orçamentária.

---

### US 6.1 — Gestão de Períodos de Projetos (Vigency & Allocations)

**Arquivos:** `projects.spec.ts`, `validations.spec.ts`

```text
PASSOU  cria projeto com novos campos (resourceSource, startDate, endDate)
PASSOU  rejeita criação via Schema Validation 422 caso endDate < startDate
PASSOU  bloqueia alocação de itens de custo em projetos com vigência expirada
PASSOU  valida expansão segura de períodos e bloqueia encolhimento retroativo
```

**Regras verificadas:**
- A API rejeita projetos com "temporal shrinkage" (encolhimento temporal malicioso ou acidental) invertido na raiz usando a flag customizada no Zod (`projectPeriodCheck`).
- Strict coverage adicionada: O sistema de transações do banco rejeita tentativas de um aluno atrelar gastos de viagem a um fundo/projeto que já tenha sua verba ou prazo de vigência expirados na data atual.

---

### US 6.2 — Dashboard de Compliance (Visão do Coordenador)

**Arquivo:** `conclusion-flow.spec.ts`, `reports.spec.ts`

```text
PASSOU  payload de resposta expõe dados bancários do estudante para papéis da Coordenação
PASSOU  inclusão dinâmica de departureDate e returnDate no detalhe
PASSOU  active filtering e inline PDF grouping expostos no payload de reports
```

**Regras verificadas:**
- O detalhamento foi auditado no contrato de resposta: O Coordenador recebe a entidade raiz unida ao profile do aluno (`student.profile.pixKey`, `bankCode`), viabilizando reembolsos precisos e diretos no painel web da universidade sem integrações extras.
- As datas atreladas à viagem não residem de forma fixa na despesa mãe, sendo extraídas e processadas diretamente do nó JSON `surveyAnswers.data` dinamicamente.

---

### US 6.3 — Fluxo de Edição e Invoices Tardios

**Arquivos:** `correction-flow.spec.ts`, `deletion.spec.ts`, `invalid-transitions.spec.ts`

```text
PASSOU  patch mescla campos de formulário atualizados (surveyAnswers)
PASSOU  patch salva a string invoiceKey com anexos tardios do Storage (R2)
PASSOU  deleção limpa dependências em cascata com segurança nas quebras de custo
PASSOU  bloqueia transições de ciclo de vida inválidas
```

**Regras verificadas:**
- Quando uma despesa é devolvida pela secretaria (`EM_EDICAO`), o aluno pode preencher recibos esquecidos. A infraestrutura de formulários mescla de forma cirúrgica as chaves do Bucket S3 (`invoiceKey`) no objeto dinâmico sem sobrescrever as preferências antigas daquele JSON.
- A correção limpa o campo `correctionReason` e o status volta organicamente para `APROVADO`.

---

### US 6.4 — Semântica de Formulários e Diárias

**Arquivo:** `preference-survey.schema.test.ts`

```text
PASSOU  força que a rubrica de Diárias trafegue em um Objeto em vez de primitivo booleano
PASSOU  normaliza o output de formulário para 'diarias' com rigor governamental contábil
```

**Regras verificadas:**
- A categoria é nomeada estritamente como "Diárias" ao invés de "Hospedagem", refletindo a taxonomia e as regras de compliance de agências de fomento governamentais (onde a rubrica cobre locomoção, refeição e hotel, não apenas dormitório em espécie).
- O backend rejeita a emissão livre de booleanos literais, exigindo que as diárias subam encapsuladas em `{ requested: true }`. É uma estratégia de escalabilidade horizontal para futuras expansões modulares do MEC/Instituição (ex: requerer quantificação de noites).

---

## Resumo dos testes da Sprint 6

| User Story | Tipo | Arquivos Relevantes | Testes Impactados | Resultado |
|---|---|---|---|---|
| US 6.0 — Arquitetura 1:N CostBreakdowns & Update | Unit / Integration | project-assignment.service.test.ts, analytics.service.test.ts, top-projects.spec.ts, admin-dashboard.spec.ts, update.spec.ts, archived-project.spec.ts | 43 | PASSOU |
| US 6.1 — Gestão de Períodos de Projetos | Unit / Integration | projects.spec.ts, validations.spec.ts | 21 | PASSOU |
| US 6.2 — Dashboard de Compliance | Unit / Integration | conclusion-flow.spec.ts, reports.spec.ts | 10 | PASSOU |
| US 6.3 — Correção de Invoices e Fluxos | Unit / Integration | correction-flow.spec.ts, deletion.spec.ts, invalid-transitions.spec.ts | 14 | PASSOU |
| US 6.4 — Semântica de Diárias | Unit | preference-survey.schema.test.ts | 12 | PASSOU |
| *Refatorações Herdadas* | Unit | attachment, auth, report.service.test.ts, sprint2-flow | 55 | PASSOU |
| **Total Sprint 6 (Criados/Refatorados)** | | | **155** | **PASSOU** |
