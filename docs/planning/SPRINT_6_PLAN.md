# Sprint 6 — Plano Frontend

> Data: 2026-06-21  
> Branch base: `main`

---

## Legenda de complexidade

| Nível | Critério |
|---|---|
| `Baixa` | Substituição de string, adição de campo simples, remoção de bloco — menos de 30 min |
| `Média` | Envolve múltiplos arquivos, lógica condicional nova ou verificação de contrato de API — 30 min a 1,5h |
| `Alta` | Novo componente/fluxo, carregamento de dados assíncrono, integração de estado entre partes — mais de 1,5h |

## Resumo de complexidade por task

| Task | Complexidade |
|---|---|
| A1 — Remover FileDropZone de invoice | `Baixa` ✅ |
| A2 — Sanitizar payload POST expenses | `Baixa` ✅ |
| B1 — Remover seção "Vincular Projeto" | `Baixa` ✅ |
| B2 — Atualizar tipo CostBreakdown | `Baixa` ✅ |
| B3 — Atualizar CostBreakdownPayload | `Baixa` ✅ |
| B4 — Seletor de projeto por linha (discriminação) | `Alta` ⏳ Part 2 |
| B5 — Dashboard: métricas por projeto | `Média` ⏳ Part 2 |
| C1 — Renomear "Código" → "Sigla" | `Baixa` ✅ |
| C2 — Campo "Fonte de recurso" | `Baixa` ✅ |
| C3 — Campos "Data de início/fim" | `Baixa` ✅ |
| C4 — Atualizar services/projects | `Baixa` ✅ |
| C5 — Exibir novos campos em listagem/detalhe | `Baixa` ✅ |
| D1 — Dados bancários no detalhe do coordenador | `Média` ⏳ Part 2 |
| D2 — Datas de ida/volta no detalhe do coordenador | `Baixa` ⏳ Part 2 |
| D3 — Alinhar layout coordenador com admin | `Alta` ⏳ Part 2 |
| E1 — Adicionar tipos departureDate/returnDate em Expense | `Baixa` ✅ |
| E2 — Datas na listagem do admin | `Baixa` ✅ |
| E3 — Datas no detalhe do admin | `Baixa` ✅ |
| F1 — "Hospedagem" → "Diárias" | `Baixa` ✅ |
| F2 — "Categorias de despesa" → "Categoria de ajuda de custo" | `Baixa` ✅ |
| F3 — "Memorando" → "Trabalho publicado" | `Baixa` ✅ |
| F4 — "Despesa/despesa" → "Receita/receita" (labels) | `Média` ✅ |
| F5 — "Total de gastos" → "Total de receitas" | `Baixa` ✅ |
| F6 — "valor total das despesas" → "valor total das receitas" | `Baixa` ✅ |
| F7 — "Orçamento comprometido" → "Total das despesas" | `Baixa` ✅ |
| F8 — "Despesas por Status" → "Status das receitas" | `Baixa` ✅ |

**Total: 2 `Alta` · 4 `Média` · 20 `Baixa`**

---

## Grupos de trabalho

As tarefas estão divididas em 6 grupos por afinidade. Recomenda-se executar A → B → C → D → E → F, pois B depende de A (remoção de vincular projeto) e F é puramente textual (pode ser feito em paralelo no final).

---

## Grupo A — Remoção do upload de invoice

**Arquivos afetados:** `frontend/src/components/ModalNovaDespesa.tsx`

### A1 — Remover campo FileDropZone de boleto/invoice `Baixa`
- Localizar a seção de "Inscrição" no modal (~linha 558)
- Remover o `<FileDropZone>` do boleto/invoice e seu estado `inscricaoFile` / `setInscricaoFile`
- Remover a validação (~linha 264): `"Anexe o boleto/invoice para a categoria Inscrição."`
- Remover o bloco de upload S3 e atribuição de `invoiceKey` (~linhas 305–311)

### A2 — Sanitizar payload de POST /v1/expenses `Baixa`
- Garantir que `invoiceKey` nunca seja enviado no corpo da requisição (nem como `undefined`, nem como `null`)
- Verificar o objeto montado antes do `fetch` em `createExpense` (`services/expenses/index.ts`) — remover qualquer referência ao campo

---

## Grupo B — Discriminação de custos por projeto (substituição de "Vincular Projeto")

**Arquivos afetados:**
- `frontend/src/pages/dashboard/admin/expenses/detail/index.tsx`
- `frontend/src/services/expenses/index.ts`
- Componente de discriminação de custos (inline no detalhe ou `ModalDiscriminacaoCustos` se extraído)

### B1 — Remover botão/seção "Vincular Projeto" do detalhe do admin `Baixa`
- Remover o bloco condicional que exibe o botão "Vincular Projeto" (visível quando status = APROVADO)
- Remover a chamada a `assignProject` do arquivo de detalhe
- O status `EM_PROCESSAMENTO` não precisa mais ser ativado via vínculo de projeto; avaliar se ainda faz sentido ou se a transição ocorrerá de outra forma (deixar comentário TODO se não definido no backend)

### B2 — Atualizar tipo `CostBreakdown` em `services/expenses/index.ts` `Baixa`
- Adicionar campo `projectId?: string | null` ao tipo `CostBreakdown` (linha ~16)
- Adicionar campo `project?: ProjectInfo | null` ao tipo `CostBreakdown` (para exibição do nome/sigla)
- Avaliar remoção de `projectId` do tipo `Expense` se o campo migrar para `CostBreakdown` — manter apenas se o backend ainda usa nos dois lugares

### B3 — Atualizar `CostBreakdownPayload` em `services/expenses/index.ts` `Baixa`
- Adicionar `projectId: string` ao tipo `CostBreakdownPayload` (~linha 127)
- Atualizar a função `createCostBreakdown` para enviar `projectId` no body

### B4 — Adicionar seletor de projeto por linha na discriminação de custos `Alta`
- Na tabela/formulário de discriminação de custos (detalhe do admin, seção EM_PROCESSAMENTO):
  - Adicionar coluna "Projeto" na tabela de itens já criados (exibir sigla do projeto)
  - Adicionar campo `<select>` de projeto no formulário de nova linha, populado via `listProjects`
  - Passar `projectId` selecionado na chamada a `createCostBreakdown`

### B5 — Atualizar dashboard do admin para agregar métricas por projeto `Média`
- Em `pages/dashboard/admin/index.tsx`: verificar se a API `/v1/analytics/admin-dashboard` já retorna dados por projeto
- Se sim: exibir breakdown por projeto na seção de top-projects ou em card dedicado
- Se não: deixar TODO apontando o endpoint que precisará ser criado no backend

---

## Grupo C — Campos e labels de projeto

**Arquivos afetados:**
- `frontend/src/components/ModalCriarProjeto.tsx`
- `frontend/src/pages/dashboard/admin/projects/index.tsx`
- `frontend/src/pages/dashboard/admin/projects/detail/index.tsx`
- `frontend/src/services/projects/index.ts`
- `frontend/src/lib/schemas.ts` (validação do campo `code`)

### C1 — Renomear "Código do projeto" → "Sigla do projeto" `Baixa`
Ocorrências a alterar (somente labels visíveis, não variáveis internas):
| Arquivo | Linha aprox. | Texto atual |
|---|---|---|
| `ModalCriarProjeto.tsx` | ~59 | `"Código do projeto é obrigatório."` |
| `ModalCriarProjeto.tsx` | label do campo | `"Código do projeto"` |
| `projects/index.tsx` | cabeçalho de coluna | `"Código"` / `"Cód."` |
| `projects/detail/index.tsx` | label de exibição | `"Código"` |
| `lib/schemas.ts` | ~33 | `"Código do projeto é obrigatório"` |

> Não renomear a variável `code` nem a prop de payload — essas são internas/contrato de API.

### C2 — Adicionar campo "Fonte de recurso" em `ModalCriarProjeto.tsx` `Baixa`
- Novo estado `resourceSource: string`
- Input texto obrigatório com label "Fonte de recurso"
- Incluir no `CreateProjectPayload` de `services/projects/index.ts`

### C3 — Adicionar campos "Data de início" e "Data de fim" em `ModalCriarProjeto.tsx` `Baixa`
- Novos estados `startDate: string` e `endDate: string`
- Inputs do tipo `date`
- Validação: `endDate >= startDate` (erro inline caso contrário)
- Incluir no `CreateProjectPayload` e no tipo `Project` em `services/projects/index.ts`

### C4 — Atualizar `services/projects/index.ts` `Baixa`
- Adicionar ao tipo `Project`:
  ```ts
  resourceSource?: string | null
  startDate?: string | null
  endDate?: string | null
  ```
- Adicionar ao `CreateProjectPayload`:
  ```ts
  resourceSource: string
  startDate: string
  endDate: string
  ```

### C5 — Exibir novos campos na listagem e detalhe de projeto `Baixa`
- `pages/dashboard/admin/projects/index.tsx`: adicionar colunas "Fonte de recurso", "Início", "Fim" (ou exibir no tooltip/modal de detalhe)
- `pages/dashboard/admin/projects/detail/index.tsx`: exibir `resourceSource`, `startDate`, `endDate` nas informações do projeto

---

## Grupo D — Detalhe do coordenador

**Arquivo alvo:** `frontend/src/pages/dashboard/coordinator/expenses/detail/` (verificar se existe — se não, criar `index.tsx` espelhando o detalhe do admin sem as ações de aprovação/rejeição de gestão)

**Referência de layout:** `pages/dashboard/admin/expenses/detail/index.tsx`

### D1 — Exibir dados bancários do solicitante `Média`
Campos a exibir (vindos de `expense.student` ou de `GET /v1/expenses/:id` se o backend já retorna):
- `bankCode` — Código do banco
- `bankName` — Nome do banco
- `agency` — Agência
- `account` — Conta
- Chave PIX (`pixKey`) — verificar se o backend expõe este campo; se não, abrir TODO

> Atenção: verificar se esses campos já estão no tipo `StudentInfo` em `services/expenses/index.ts`. Se não, estender o tipo.

### D2 — Exibir `departureDate` e `returnDate` `Baixa`
- Exibir "Data de ida" e "Data de volta" formatadas em `dd/MM/yyyy`
- Verificar se `Expense` já possui esses campos (não estão no tipo atual em `services/expenses/index.ts` — precisam ser adicionados: `departureDate?: string | null`, `returnDate?: string | null`)

### D3 — Alinhar layout com detalhe do admin `Alta`
- Usar a mesma estrutura de `StatusBanner` e seções de informações
- Coordenador não deve ver botões de aprovação/rejeição final (apenas visualização)

---

## Grupo E — Campos de data na listagem e detalhe do admin

**Arquivos afetados:**
- `frontend/src/pages/dashboard/admin/expenses/index.tsx`
- `frontend/src/pages/dashboard/admin/expenses/detail/index.tsx`
- `frontend/src/services/expenses/index.ts`

### E1 — Adicionar `departureDate` e `returnDate` ao tipo `Expense` `Baixa`
- Em `services/expenses/index.ts`, adicionar ao tipo `Expense`:
  ```ts
  departureDate?: string | null
  returnDate?: string | null
  ```

### E2 — Exibir datas na listagem do admin `Baixa`
- `pages/dashboard/admin/expenses/index.tsx`: adicionar coluna "Ida / Volta" ou tooltip com as datas formatadas

### E3 — Exibir datas no detalhe do admin `Baixa`
- `pages/dashboard/admin/expenses/detail/index.tsx`: adicionar seção ou linha com "Data de ida" e "Data de volta"

---

## Grupo F — Substituições de terminologia (labels visíveis)

> Regra geral: substituir **somente strings visíveis ao usuário** (labels, placeholders, títulos, textos de UI). **Não renomear** variáveis internas, nomes de funções, tipos TypeScript, rotas de API, nem chaves de objeto.

Executar `grep -rn "<termo>" frontend/src/` antes e após cada substituição para garantir cobertura.

### F1 — "Hospedagem" → "Diárias" `Baixa`
Arquivos identificados:
- `components/ModalNovaDespesa.tsx`
- `components/ModalDetalhe.tsx`
- `pages/dashboard/student/expenses/detail/[id].tsx`
- `pages/dashboard/admin/expenses/detail/index.tsx`

Verificação extra:
```bash
grep -rn "Hospedagem" frontend/src/
```

### F2 — "Categorias de despesa" → "Categoria de ajuda de custo" `Baixa`
Ocorrência identificada:
- `components/ModalNovaDespesa.tsx` (~linha 465): `<SectionHeader number={4} label="Categorias de Despesa" />`

### F3 — "Memorando" → "Trabalho publicado" `Baixa`
Ocorrências identificadas (apenas labels visíveis):
| Arquivo | Texto a substituir |
|---|---|
| `components/ModalNovaDespesa.tsx` | `label="Memorando"` no SectionHeader, label do FileDropZone, mensagem de validação |
| `components/ModalDetalhe.tsx` | heading `"Memorando"` |
| `pages/dashboard/student/expenses/detail/[id].tsx` | `"Memorando"` (label exibido) |
| `pages/dashboard/admin/expenses/detail/index.tsx` | `"Memorando"` (label exibido, banner de status) |

> **Não renomear:** a variável interna `memorando`, `setMemorandum`, `uploadMemorandum` — são internas/API.

### F4 — "Despesa" / "despesa" → "Receita" / "receita" (labels visíveis) `Média`
Substituições **seletivas** (somente onde o texto é exibido ao usuário final):

| Arquivo | Texto atual | Texto novo |
|---|---|---|
| `components/ModalNovaDespesa.tsx` | `"Enviar Solicitação de Despesa"` | `"Enviar Solicitação de Receita"` |
| `components/ModalRejeitar.tsx` | `"Rejeitar Solicitação de Despesa"` | `"Rejeitar Solicitação de Receita"` |
| `pages/dashboard/admin/index.tsx` | `"ID Despesa"` | `"ID Receita"` |
| `pages/dashboard/student/index.tsx` | coluna `"Despesa"` na tabela | `"Receita"` |
| `pages/dashboard/admin/projects/detail/index.tsx` | `"Item de Despesa"` | `"Item de Receita"` |
| `pages/dashboard/admin/index.tsx` | `"Últimas despesas registradas"` | `"Últimas receitas registradas"` |
| `pages/dashboard/admin/index.tsx` | `"Nenhuma despesa registrada."` | `"Nenhuma receita registrada."` |
| `pages/dashboard/admin/index.tsx` | `"Exibindo X despesas mais recentes"` | `"Exibindo X receitas mais recentes"` |
| `pages/dashboard/admin/index.tsx` | `"Pesquisar projetos, despesas..."` | `"Pesquisar projetos, receitas..."` |
| `pages/dashboard/admin/index.tsx` | `"Visão geral de todos os projetos e despesas acadêmicas"` | `"Visão geral de todos os projetos e receitas acadêmicas"` |

Verificação obrigatória antes de fechar:
```bash
grep -rn "\"Despesa\"\|\"despesa\"\| despesa \| Despesa " frontend/src/ --include="*.tsx"
```

### F5 — "Total de gastos" → "Total de receitas" `Baixa`
- Verificar admin dashboard (`pages/dashboard/admin/index.tsx`) e quaisquer cards de métricas

### F6 — "valor total das despesas" → "valor total das receitas" `Baixa`
- `pages/dashboard/admin/index.tsx` (~linha 163): `<p>valor total das despesas</p>`

### F7 — "Orçamento comprometido" → "Total das despesas" `Baixa`
- Verificar admin dashboard e páginas de projeto

### F8 — "Despesas por Status" → "Status das receitas" `Baixa`
- `pages/dashboard/admin/index.tsx` (~linha 212): `"Despesas por Status"`

---

## Checklist de entrega

- [x] **A** — Invoice removido do modal e do payload ✅ (commit 26bbd02)
- [ ] **B** — B1 ✅ (textos órfãos de "vincular projeto" removidos); B2+B3 ✅ tipos atualizados; B4 ⏳ Part 2; B5 ⏳ Part 2
- [x] **C** — "Sigla do projeto" em todos os pontos ✅; campos `resourceSource`, `startDate`, `endDate` no modal e serviço ✅ (commit 0ea6eb1)
- [ ] **D** — D1, D3 ⏳ Part 2; D2 coberto por E1 ✅
- [x] **E** — `departureDate`/`returnDate` tipados em `Expense` ✅; coluna na listagem ✅; no detalhe admin ✅ (commits 1a8be27, 0bec78d, 6081406)
- [x] **F** — Todas as substituições de terminologia concluídas ✅; "Sem memorando" → "Sem trabalho publicado" corrigido ✅
- [x] Build sem erros de TypeScript (`tsc --noEmit`) — 0 erros ✅ (20 pré-existentes corrigidos: `city`/`state`/`country` em `Expense`, `ReportFilters`, `ExportReportError`, `valor` em `ModalRejeitar`)
- [ ] Testes manuais nos fluxos críticos: criar receita (aluno), detalhe admin, detalhe coordenador, criação de projeto
