# DOCUMENTAÇÃO COMPLETA DE TESTES - SPRINT 2

**Sistema:** Fly Costs Tool (SGDA)  
**Data:** 03/05/2026  
**Framework:** Vitest 4.1.4  
**Sprint:** 2

---

## Como converter este arquivo para Google Docs

1. **Opção A - Extensão do Chrome (Recomendada)**
   - Instale: [Docs to Markdown](https://workspace.google.com/marketplace/app/docs_to_markdown/700168918607)
   - Abra este arquivo `.md` no editor
   - Copie todo o conteúdo
   - No Google Docs vazio, use a extensão para colar com formatação

2. **Opção B - Conversão Online**
   - Acesse: [Markdown to HTML](https://markdowntohtml.com/)
   - Cole o conteúdo deste arquivo
   - Copie o resultado
   - Cole no Google Docs (mantém formatação)

---

## PARTE 1: VISÃO GERAL DA SPRINT 2

### Escopo
Testes unitários e de integração dos novos recursos da Sprint 2:
- Gestão completa de projetos (CRUD)
- Atribuição de projetos a despesas aprovadas
- Discriminação de custos (cost breakdown) por subcategorias
- Anexos via Cloudflare R2 (storage)
- Analytics e métricas gerenciais para Admin
- Fluxo completo de rejeição com motivo obrigatório

### Objetivo
Validar regras de negócio, integrações entre serviços e fluxos end-to-end implementados na Sprint 2.

### Módulos Cobertos
- `project.service.ts` - CRUD de projetos
- `expense.service.ts` - Atribuição de projetos (assignProjectToExpense)
- `budget.service.ts` - Discriminação de custos
- `analytics.service.ts` - Métricas do dashboard admin
- `lib/storage.ts` - Upload/validação R2
- Testes de integração E2E

---

## PARTE 2: ESTRATÉGIA DE TESTES

### Abordagem
- **Testes Unitários:** Serviços isolados com mocks do Prisma
- **Testes de Integração:** Fluxos completos com banco de dados real (PostgreSQL de teste)

### Ferramentas
- **Vitest 4.1.4** - Executor de testes
- **Vi** - Sistema de mocks
- **Hono Testing Client** - Testes de rotas HTTP
- **Zod 4.0.0** - Validação de schemas
- **AWS SDK (S3)** - Cliente R2 mockado
- **PostgreSQL** - Banco de teste (integração)

### Critérios de Aceitação
- Todos os testes devem passar
- Cobertura mínima: 80%
- Tempo de execução: menor que 5 segundos (unitários), menor que 30 segundos (integração)
- Testes independentes e isolados
- Rollback automático após cada teste de integração

### Estratégia de Mocks
- Prisma Client mockado (testes unitários)
- Serviços externos mockados (budget, storage)
- AWS S3 Client mockado
- Variáveis de ambiente mockadas

---

## PARTE 3: TESTES UNITÁRIOS

---

### 3.1 SERVIÇO DE PROJETOS (project.service)

**Arquivo:** `testes/backend/project.service.test.ts`

#### TC-PROJ-001: Criação de projeto com subcategorias conecta categorias existentes
**Prioridade:** CRÍTICA  
**Nível de Risco:** ALTO  
**Pré-condições:** 
- Categorias de despesa existem no banco
- Código do projeto não está duplicado

**Dados de Teste:**
```
name: "Lab"
code: "LAB-1"
budget: 50000
subcategories: ["passagem", "hospedagem"]
```

**Passos do Teste:**
- **Dado:** Dados válidos de projeto com duas subcategorias
- **Quando:** `createProject()` é chamada
- **Então:** 
  - Projeto é criado
  - Subcategorias são conectadas
  - `usedBudget` inicia em 0

**Resultado Esperado:** 
- Objeto projeto com `subcategories: ["passagem", "hospedagem"]`
- `usedBudget: 0`

---

#### TC-PROJ-002: Edição atualiza nome e code quando válido
**Prioridade:** ALTA  
**Nível de Risco:** MÉDIO  
**Pré-condições:** Projeto existe no banco

**Dados de Teste:**
```
projectId: "323e4567-e89b-12d3-a456-426614174002"
updates: { name: "Novo", code: "NEW" }
```

**Passos do Teste:**
- **Dado:** ID de projeto existente e novos valores
- **Quando:** `updateProject(PID, { name: "Novo", code: "NEW" })` é chamada
- **Então:** 
  - Projeto é atualizado
  - Nome e código refletem novos valores

**Resultado Esperado:** 
- `name: "Novo"`
- `code: "NEW"`

---

#### TC-PROJ-003: Arquivamento (soft delete) define isActive como false
**Prioridade:** CRÍTICA  
**Nível de Risco:** ALTO  
**Pré-condições:** Projeto está ativo (`isActive: true`)

**Dados de Teste:**
```
projectId: "323e4567-e89b-12d3-a456-426614174002"
```

**Passos do Teste:**
- **Dado:** Projeto ativo
- **Quando:** `deleteProject(PID)` é chamada
- **Então:** 
  - `isActive` é definido como `false`
  - Registro permanece no banco (soft delete)

**Resultado Esperado:** 
- `isActive: false`
- Prisma `update` foi chamado com `data: { isActive: false }`

---

#### TC-PROJ-004: Validação - Menos que MIN_SUBCATEGORIES retorna erro
**Prioridade:** ALTA  
**Nível de Risco:** MÉDIO  
**Pré-condições:** Nenhuma

**Dados de Teste:**
```
name: "X"
code: "X1"
budget: 100
subcategories: []
```

**Passos do Teste:**
- **Dado:** Lista vazia de subcategorias
- **Quando:** `createProject()` é chamada
- **Então:** Retorna erro `INVALID_SUBCATEGORIES_COUNT`

**Resultado Esperado:** 
- `{ error: "INVALID_SUBCATEGORIES_COUNT" }`

---

#### TC-PROJ-005: Validação - Mais que MAX_SUBCATEGORIES retorna erro
**Prioridade:** ALTA  
**Nível de Risco:** MÉDIO  
**Pré-condições:** `MAX_SUBCATEGORIES` definido (ex: 10)

**Dados de Teste:**
```
name: "X"
code: "X2"
budget: 100
subcategories: ["cat0", "cat1", ..., "cat11"] (11 itens)
```

**Passos do Teste:**
- **Dado:** Lista com mais subcategorias que o limite permitido
- **Quando:** `createProject()` é chamada
- **Então:** Retorna erro `INVALID_SUBCATEGORIES_COUNT`

**Resultado Esperado:** 
- `{ error: "INVALID_SUBCATEGORIES_COUNT" }`

---

#### TC-PROJ-006: Subcategorias inexistentes retorna erro
**Prioridade:** CRÍTICA  
**Nível de Risco:** ALTO  
**Pré-condições:** Subcategoria "fantasma" não existe no banco

**Dados de Teste:**
```
name: "Y"
code: "Y8"
budget: 1000
subcategories: ["fantasma"]
```

**Passos do Teste:**
- **Dado:** Subcategoria inválida
- **Quando:** `createProject()` é chamada
- **Então:** 
  - `validateSubcategoriesExist()` retorna `false`
  - Retorna erro `SUBCATEGORIES_NOT_FOUND`

**Resultado Esperado:** 
- `{ error: "SUBCATEGORIES_NOT_FOUND" }`

---

#### TC-PROJ-007: usedBudget na resposta reflete valor comprometido persistido
**Prioridade:** MÉDIA  
**Nível de Risco:** BAIXO  
**Pré-condições:** Projeto com `usedBudget` diferente de zero

**Dados de Teste:**
```
projectId: "323e4567-e89b-12d3-a456-426614174002"
usedBudget: 7500.25
budget: 50000
```

**Passos do Teste:**
- **Dado:** Projeto com budget parcialmente usado
- **Quando:** `getProjectById(PID)` é chamada
- **Então:** 
  - Retorna projeto
  - `usedBudget` reflete valor correto

**Resultado Esperado:** 
- `usedBudget: 7500.25`
- `budget: 50000`

---

### 3.2 ATRIBUIÇÃO DE PROJETO A DESPESAS (project-assignment.service)

**Arquivo:** `testes/backend/project-assignment.service.test.ts`

#### TC-ASSIGN-001: Atribuição com status APROVADO avança para EM_PROCESSAMENTO
**Prioridade:** CRÍTICA  
**Nível de Risco:** ALTO  
**Pré-condições:** 
- Despesa com `status: APROVADO`
- Projeto com budget disponível

**Dados de Teste:**
```
expenseId: "123e4567-e89b-12d3-a456-426614174000"
projectId: "223e4567-e89b-12d3-a456-426614174001"
projectAvailableBudget: 5000
```

**Passos do Teste:**
- **Dado:** Despesa aprovada e projeto com saldo
- **Quando:** `assignProjectToExpense(EXPENSE_ID, PROJECT_ID)` é chamada
- **Então:** 
  - Status muda para `EM_PROCESSAMENTO`
  - `projectId` é atribuído

**Resultado Esperado:** 
- `status: EM_PROCESSAMENTO`
- `projectId: "223e4567-e89b-12d3-a456-426614174001"`

---

#### TC-ASSIGN-002: Status diferente de APROVADO retorna CONFLICT
**Prioridade:** CRÍTICA  
**Nível de Risco:** ALTO  
**Pré-condições:** Despesa com `status: PENDENTE`

**Dados de Teste:**
```
expenseId: "123e4567-e89b-12d3-a456-426614174000"
projectId: "223e4567-e89b-12d3-a456-426614174001"
currentStatus: PENDENTE
```

**Passos do Teste:**
- **Dado:** Despesa ainda pendente
- **Quando:** `assignProjectToExpense()` é chamada
- **Então:** Retorna erro `CONFLICT`

**Resultado Esperado:** 
- `{ error: "Conflict" }`

---

#### TC-ASSIGN-003: Validação de budget - saldo zero retorna INSUFFICIENT_FUNDS
**Prioridade:** CRÍTICA  
**Nível de Risco:** ALTO  
**Pré-condições:** 
- Despesa aprovada
- Projeto com `availableBudget: 0`

**Dados de Teste:**
```
expenseId: "123e4567-e89b-12d3-a456-426614174000"
projectId: "223e4567-e89b-12d3-a456-426614174001"
projectAvailableBudget: 0
```

**Passos do Teste:**
- **Dado:** Projeto sem saldo disponível
- **Quando:** `assignProjectToExpense()` é chamada
- **Então:** 
  - `getProjectBudgetMetrics()` retorna `available: 0`
  - Retorna erro `INSUFFICIENT_FUNDS`

**Resultado Esperado:** 
- `{ error: "INSUFFICIENT_FUNDS" }`

---

#### TC-ASSIGN-004: Projeto arquivado retorna PROJECT_ARCHIVED
**Prioridade:** ALTA  
**Nível de Risco:** ALTO  
**Pré-condições:** 
- Despesa aprovada
- Projeto com `isActive: false`

**Dados de Teste:**
```
expenseId: "123e4567-e89b-12d3-a456-426614174000"
projectId: "223e4567-e89b-12d3-a456-426614174001"
projectIsActive: false
```

**Passos do Teste:**
- **Dado:** Projeto arquivado
- **Quando:** `assignProjectToExpense()` é chamada
- **Então:** Retorna erro `PROJECT_ARCHIVED`

**Resultado Esperado:** 
- `{ error: "PROJECT_ARCHIVED" }`

---

### 3.3 ANEXOS E STORAGE R2 (admin-attachment.service)

**Arquivo:** `testes/backend/admin-attachment.service.test.ts`

#### TC-STORAGE-001: Mock de uploadFile retorna metadados simulados
**Prioridade:** ALTA  
**Nível de Risco:** MÉDIO  
**Pré-condições:** AWS S3 Client mockado

**Dados de Teste:**
```
file: Buffer com PDF válido
fileName: "file.pdf"
```

**Passos do Teste:**
- **Dado:** Arquivo PDF mockado
- **Quando:** Simulação de `uploadFile()` é executada
- **Então:** Retorna metadados corretos

**Resultado Esperado:**
```
{
  fileKey: "admin-attachments/uuid-file.pdf",
  fileName: "file.pdf",
  fileSize: 1024
}
```

---

#### TC-STORAGE-002: Mock de validatePDF valida assinatura PDF
**Prioridade:** CRÍTICA  
**Nível de Risco:** ALTO  
**Pré-condições:** Nenhuma

**Dados de Teste:**
```
validPDF: Buffer iniciando com "%PDF"
invalidBuffer: Buffer com texto comum
```

**Passos do Teste:**
- **Dado:** Dois buffers - um válido e um inválido
- **Quando:** Validação de assinatura é executada
- **Então:** 
  - Buffer válido: primeiros 4 bytes = "%PDF"
  - Buffer inválido: primeiros 4 bytes ≠ "%PDF"

**Resultado Esperado:** 
- `validPDF.slice(0,4).toString() === "%PDF"`: TRUE
- `invalidBuffer.slice(0,4).toString() === "%PDF"`: FALSE

---

#### TC-STORAGE-003: Validação de tamanho máximo em MB
**Prioridade:** ALTA  
**Nível de Risco:** MÉDIO  
**Pré-condições:** Limite de 5MB configurado

**Dados de Teste:**
```
maxSizeInMB: 5
maxSizeBytes: 5242880 (5 * 1024 * 1024)
smallFile: Buffer(1024)
largeFile: Buffer(5242881)
```

**Passos do Teste:**
- **Dado:** Arquivos de tamanhos diferentes
- **Quando:** Validação de tamanho é executada
- **Então:** 
  - Arquivo pequeno: aprovado
  - Arquivo grande: rejeitado

**Resultado Esperado:** 
- `smallFile.length < maxSizeBytes`: TRUE
- `largeFile.length > maxSizeBytes`: TRUE

---

#### TC-STORAGE-004: Chaves de arquivo devem incluir UUID e nome sanitizado
**Prioridade:** MÉDIA  
**Nível de Risco:** BAIXO  
**Pré-condições:** Nenhuma

**Dados de Teste:**
```
fileName: "my-file test (1).pdf"
```

**Passos do Teste:**
- **Dado:** Nome de arquivo com caracteres especiais
- **Quando:** Sanitização é aplicada
- **Então:** Caracteres especiais são substituídos por "_"

**Resultado Esperado:** 
- `sanitized: "my-file_test__1_.pdf"`
- Não contém espaços nem parênteses

---

#### TC-STORAGE-005: Operações S3 esperam comandos Put/Delete/Get
**Prioridade:** BAIXA  
**Nível de Risco:** BAIXO  
**Pré-condições:** AWS SDK mockado

**Dados de Teste:**
```
operations: ["PutObject", "DeleteObject", "GetObject"]
```

**Passos do Teste:**
- **Dado:** Lista de operações S3 esperadas
- **Quando:** Validação de padrão é executada
- **Então:** Todas as operações terminam com "Object"

**Resultado Esperado:** 
- Todas as strings terminam com "Object"

---

### 3.4 ANALYTICS E MÉTRICAS (analytics.service)

**Arquivo:** `testes/backend/analytics.service.test.ts`

#### TC-ANALYTICS-001: getAdminDashboardStats agrega totais e métricas de budget
**Prioridade:** CRÍTICA  
**Nível de Risco:** ALTO  
**Pré-condições:** Despesas e projetos existem no banco (mockados)

**Dados de Teste:**
```
totalRequests: 42
byStatus:
  PENDENTE: 20
  APROVADO: 15
  EM_PROCESSAMENTO: 7
totalBudget: 100000
usedBudget: 35000
committedBudget: 12500
```

**Passos do Teste:**
- **Dado:** Dados mockados de agregação Prisma
- **Quando:** `getAdminDashboardStats()` é chamada
- **Então:** 
  - Retorna contagem total
  - Retorna breakdown por status
  - Retorna valores de budget

**Resultado Esperado:**
```
{
  totalRequests: 42,
  byStatus: { PENDENTE: 20, APROVADO: 15, EM_PROCESSAMENTO: 7 },
  totalValue: 100000,
  budgetCommitted: 12500
}
```

---

#### TC-ANALYTICS-002: groupBy alimenta todas as chaves de status presentes
**Prioridade:** ALTA  
**Nível de Risco:** MÉDIO  
**Pré-condições:** Apenas despesas rejeitadas no mock

**Dados de Teste:**
```
totalRequests: 3
groupBy: [{ status: REJEITADO, _count: { id: 3 } }]
```

**Passos do Teste:**
- **Dado:** Resultado de `groupBy` com apenas um status
- **Quando:** `getAdminDashboardStats()` é chamada
- **Então:** `byStatus.REJEITADO` é populado corretamente

**Resultado Esperado:** 
- `byStatus.REJEITADO: 3`
- `totalRequests: 3`

---

#### TC-ANALYTICS-003: budgetCommitted usa aggregate filtrado por despesas ativas
**Prioridade:** CRÍTICA  
**Nível de Risco:** ALTO  
**Pré-condições:** Mock de Prisma configurado

**Dados de Teste:**
```
aggregate: { _sum: { usedBudget: 999 } }
filter: { status: { in: [APROVADO, EM_PROCESSAMENTO] } }
```

**Passos do Teste:**
- **Dado:** Chamada a `project.aggregate`
- **Quando:** `getAdminDashboardStats()` é chamada
- **Então:** Filtro correto é aplicado no segundo `aggregate`

**Resultado Esperado:** 
- `where` contém filtro por status `APROVADO` e `EM_PROCESSAMENTO`

---

#### TC-ANALYTICS-004: getTopProjects retorna até N projetos ordenados por uso
**Prioridade:** ALTA  
**Nível de Risco:** MÉDIO  
**Pré-condições:** Projetos mockados

**Dados de Teste:**
```
limit: 2
projects:
  - id: "p1", name: "Alpha", usedBudget: 900, _count: { expenseRequests: 4 }
  - id: "p2", name: "Beta", usedBudget: 800, _count: { expenseRequests: 9 }
```

**Passos do Teste:**
- **Dado:** Dois projetos com valores e contagens
- **Quando:** `getTopProjects(2)` é chamada
- **Então:** 
  - Retorna exatamente 2 projetos
  - Ordenados por `usedBudget` DESC

**Resultado Esperado:**
```
[
  { id: "p1", name: "Alpha", totalRequests: 4, totalValue: 900 },
  { id: "p2", name: "Beta", totalRequests: 9, totalValue: 800 }
]
```

---

#### TC-ANALYTICS-005: getTopProjects usa limite padrão quando omitido
**Prioridade:** BAIXA  
**Nível de Risco:** BAIXO  
**Pré-condições:** Nenhuma

**Dados de Teste:**
```
(sem parâmetro de limite)
```

**Passos do Teste:**
- **Dado:** Chamada sem limite
- **Quando:** `getTopProjects()` é chamada (sem argumentos)
- **Então:** `take: 5` é passado ao Prisma

**Resultado Esperado:** 
- `prisma.project.findMany` recebe `take: 5`

---

#### TC-ANALYTICS-006: Valores somados usam fallback 0 quando aggregate vem vazio
**Prioridade:** MÉDIA  
**Nível de Risco:** MÉDIO  
**Pré-condições:** Banco sem dados

**Dados de Teste:**
```
aggregate: { _sum: { budget: null, usedBudget: null } }
```

**Passos do Teste:**
- **Dado:** Agregação retorna valores `null`
- **Quando:** `getAdminDashboardStats()` é chamada
- **Então:** Valores são substituídos por 0

**Resultado Esperado:** 
- `totalValue: 0`
- `budgetCommitted: 0`

---

### 3.5 DISCRIMINAÇÃO DE CUSTOS (cost-breakdown.service)

**Arquivo:** `testes/backend/cost-breakdown.service.test.ts`

#### TC-BREAKDOWN-001: Persiste discriminação e retorna objeto criado
**Prioridade:** CRÍTICA  
**Nível de Risco:** ALTO  
**Pré-condições:** 
- Despesa com projeto atribuído
- Subcategoria existe no projeto

**Dados de Teste:**
```
expenseId: "exp-1"
data:
  subcategoryName: "passagem"
  amount: 500
```

**Passos do Teste:**
- **Dado:** Despesa e subcategoria válidos
- **Quando:** `createCostBreakdown("exp-1", { subcategoryName: "passagem", amount: 500 })` é chamada
- **Então:** 
  - Registro criado no banco
  - Retorna objeto com categoria vinculada

**Resultado Esperado:**
```
{
  id: "cb-1",
  amount: 500,
  expenseCategory: { normalizedName: "passagem", name: "Passagem", id: "cat-1" }
}
```

---

#### TC-BREAKDOWN-002: Aceita valor dentro do budget
**Prioridade:** CRÍTICA  
**Nível de Risco:** ALTO  
**Pré-condições:** Projeto com budget disponível

**Dados de Teste:**
```
expenseId: "exp-2"
data:
  subcategoryName: "inscricao"
  amount: 600
```

**Passos do Teste:**
- **Dado:** Valor menor que budget disponível
- **Quando:** `createCostBreakdown()` é chamada
- **Então:** Discriminação é criada sem erro

**Resultado Esperado:** 
- `{ id: "cb-2", amount: 600 }`

---

#### TC-BREAKDOWN-003: Subcategoria fora do projeto retorna erro
**Prioridade:** CRÍTICA  
**Nível de Risco:** ALTO  
**Pré-condições:** Projeto não possui subcategoria "hotel_inexistente"

**Dados de Teste:**
```
expenseId: "exp-3"
data:
  subcategoryName: "hotel_inexistente"
  amount: 50
```

**Passos do Teste:**
- **Dado:** Subcategoria não vinculada ao projeto
- **Quando:** `createCostBreakdown()` é chamada
- **Então:** Retorna erro `INVALID_SUBCATEGORIES_COUNT`

**Resultado Esperado:** 
- `{ error: "INVALID_SUBCATEGORIES_COUNT" }`

---

#### TC-BREAKDOWN-004: Valor acima do disponível retorna INSUFFICIENT_FUNDS
**Prioridade:** CRÍTICA  
**Nível de Risco:** ALTO  
**Pré-condições:** Budget disponível menor que valor solicitado

**Dados de Teste:**
```
expenseId: "exp-4"
data:
  subcategoryName: "passagem"
  amount: 100 (disponível: 50)
```

**Passos do Teste:**
- **Dado:** Valor solicitado maior que budget disponível
- **Quando:** `createCostBreakdown()` é chamada
- **Então:** Retorna erro `INSUFFICIENT_FUNDS`

**Resultado Esperado:** 
- `{ error: "INSUFFICIENT_FUNDS" }`

---

#### TC-BREAKDOWN-005: Projeto arquivado retorna PROJECT_ARCHIVED
**Prioridade:** ALTA  
**Nível de Risco:** ALTO  
**Pré-condições:** Projeto com `isActive: false`

**Dados de Teste:**
```
expenseId: "exp-5"
data:
  subcategoryName: "passagem"
  amount: 10
projectIsActive: false
```

**Passos do Teste:**
- **Dado:** Projeto arquivado
- **Quando:** `createCostBreakdown()` é chamada
- **Então:** Retorna erro `PROJECT_ARCHIVED`

**Resultado Esperado:** 
- `{ error: "PROJECT_ARCHIVED" }`

---

#### TC-BREAKDOWN-006: Despesa sem projeto retorna NOT_FOUND
**Prioridade:** ALTA  
**Nível de Risco:** MÉDIO  
**Pré-condições:** Despesa sem `projectId` atribuído

**Dados de Teste:**
```
expenseId: "exp-6"
data:
  subcategoryName: "passagem"
  amount: 10
projectId: null
```

**Passos do Teste:**
- **Dado:** Despesa sem projeto
- **Quando:** `createCostBreakdown()` é chamada
- **Então:** Retorna erro `NOT_FOUND`

**Resultado Esperado:** 
- `{ error: "Not Found" }`

---

### 3.6 FLUXO COMPLETO SPRINT 2 (sprint2-flow.integration)

**Arquivo:** `testes/backend/sprint2-flow.integration.test.ts`

#### TC-FLOW-001: Fluxo completo - Criar → Aprovar → Atribuir → Discriminar → Visualizar
**Prioridade:** CRÍTICA  
**Nível de Risco:** ALTO  
**Pré-condições:** 
- Sistema configurado
- Mocks de storage e budget ativos

**Dados de Teste:**
```
studentId: "c341c8fa-724f-4ab2-9a4e-5ca55f201ad4"
expenseData:
  title: "Congresso"
  city: "Manaus"
  state: "BR-AM"
  country: "BR"
  departureDate: "2026-07-01"
  returnDate: "2026-07-05"
projectId: "223e4567-e89b-12d3-a456-426614174001"
costBreakdownData:
  subcategoryName: "passagem"
  amount: 800
```

**Passos do Teste:**

**ETAPA 1 - Criação:**
- **Dado:** Dados válidos de despesa
- **Quando:** `createExpenseRequest(STUDENT_ID, data)` é chamada
- **Então:** 
  - Despesa criada com `status: PENDENTE`
  - Sem erro retornado

**ETAPA 2 - Aprovação:**
- **Dado:** Despesa pendente
- **Quando:** `updateExpenseStatus(EXPENSE_ID, APROVADO)` é chamada
- **Então:** Status muda para `APROVADO`

**ETAPA 3 - Atribuição de Projeto:**
- **Dado:** Despesa aprovada
- **Quando:** `assignProjectToExpense(EXPENSE_ID, PROJECT_ID)` é chamada
- **Então:** 
  - Status muda para `EM_PROCESSAMENTO`
  - `projectId` é atribuído

**ETAPA 4 - Discriminação de Custos:**
- **Dado:** Despesa em processamento
- **Quando:** `createCostBreakdown(EXPENSE_ID, { subcategoryName: "passagem", amount: 800 })` é chamada
- **Então:** Discriminação criada sem erro

**ETAPA 5 - Visualização:**
- **Dado:** Despesa completa
- **Quando:** `getExpenseById(EXPENSE_ID, STUDENT_ID, ALUNO)` é chamada
- **Então:** 
  - Retorna despesa completa
  - Inclui projeto atribuído
  - Inclui discriminação de custos

**Resultado Esperado:**
```
{
  id: EXPENSE_ID,
  status: "EM_PROCESSAMENTO",
  projectId: PROJECT_ID,
  project: { id: PROJECT_ID, name: "Proj", code: "P1" },
  costBreakdowns: [
    {
      id: "cb-flow",
      amount: 800,
      expenseCategory: { name: "Passagem", normalizedName: "passagem" }
    }
  ]
}
```

---

## PARTE 4: TESTES DE INTEGRAÇÃO (E2E)

---

### 4.1 FLUXO DE REJEIÇÃO COM MOTIVO

**Arquivo:** `backend/tests/integration/expenses/rejection-flow.spec.ts`

#### TC-E2E-001: Fluxo completo de rejeição - Criar → Rejeitar → Visualizar
**Prioridade:** CRÍTICA  
**Nível de Risco:** ALTO  
**Pré-condições:** 
- Banco de dados de teste ativo
- Seeds executados (usuários, categorias, projetos)
- Tokens de autenticação válidos

**Usuários:**
- Aluno: `aluno@test.com` (role: ALUNO)
- Coordenador: `coordenador@test.com` (role: COORDENADOR)

**Dados de Teste:**
```
expenseData:
  title: "Inscrição - SBSC 2026"
  description: "Inscrição para apresentação de artigo aceito..."
  city: "São Paulo"
  state: "BR-SP"
  country: "BR"
  departureDate: "2026-06-01"
  returnDate: "2026-06-05"
rejectionReason: "O aluno excedeu o limite semestral de benefícios."
```

**[STEP 1] Aluno cria uma solicitação de despesa**
- **Método:** POST `/v1/expenses`
- **Quando:** Request com dados válidos + token ALUNO
- **Então:** 
  - Status HTTP: 201 Created
  - Resposta contém `id`, `status: PENDENTE`, `rejectionReason: null`

**[STEP 2] Coordenador rejeita a solicitação COM MOTIVO**
- **Método:** PATCH `/v1/expenses/:id/status`
- **Body:** `{ status: "REJEITADO", reason: "O aluno excedeu..." }`
- **Quando:** Request com token COORDENADOR
- **Então:** 
  - Status HTTP: 200 OK
  - `status: REJEITADO`
  - `rejectionReason: "O aluno excedeu..."`

**[STEP 3] Aluno visualiza a solicitação rejeitada com o motivo**
- **Método:** GET `/v1/expenses/:id`
- **Quando:** Request com token ALUNO
- **Então:** 
  - Status HTTP: 200 OK
  - `status: REJEITADO`
  - `rejectionReason` visível para o aluno

**[STEP 4] Validar que a rejeição é definitiva - tenta rejeitar novamente**
- **Método:** PATCH `/v1/expenses/:id/status`
- **Body:** `{ status: "REJEITADO", reason: "Outro motivo" }`
- **Quando:** Request com token COORDENADOR
- **Então:** 
  - Status HTTP: 409 Conflict
  - Mensagem de erro indicando que a decisão já foi tomada

**[STEP 5] Aluno não consegue editar uma despesa rejeitada**
- **Método:** PATCH `/v1/expenses/:id/status`
- **Body:** `{ status: "APROVADO" }`
- **Quando:** Request com token ALUNO
- **Então:** 
  - Status HTTP: 403 Forbidden
  - Aluno não tem permissão para mudar status

**[STEP 6] Validar lista de despesas - aluno pode visualizar a rejeitada**
- **Método:** GET `/v1/expenses`
- **Quando:** Request com token ALUNO
- **Então:** 
  - Status HTTP: 200 OK
  - Array contém a despesa rejeitada
  - `rejectionReason` está presente

**Resultado Esperado (final):** 
- Fluxo completo executado sem falhas
- Rejeição é persistente e imutável
- Motivo é visível para o aluno
- Permissões respeitadas

---

### 4.2 COST BREAKDOWN EM PROJETO ARQUIVADO

**Arquivo:** `backend/tests/integration/cost-breakdown/archived-project.spec.ts`

#### TC-E2E-002: Não permite criar cost breakdown para projeto arquivado
**Prioridade:** ALTA  
**Nível de Risco:** ALTO  
**Pré-condições:** 
- Projeto arquivado (`isActive: false`)
- Despesa em `EM_PROCESSAMENTO` vinculada ao projeto

**Dados de Teste:**
```
projectId: ID_PROJ_IA (arquivado)
expenseId: (criado no beforeAll)
costBreakdownData:
  amount: 100
  subcategoryName: "passagem"
```

**Passos do Teste:**
- **SETUP (beforeAll):**
  - Cria despesa com `status: EM_PROCESSAMENTO`
  - Vincula ao projeto `ID_PROJ_IA`
  - Arquiva o projeto: `isActive: false`

- **Método:** POST `/v1/expenses/:id/cost-breakdown`
- **Body:** `{ amount: 100, subcategoryName: "passagem" }`
- **Quando:** Request com token ADMIN
- **Então:** 
  - Status HTTP: 409 Conflict
  - Mensagem contém "arquivado"

**Resultado Esperado:** 
- Sistema rejeita criação de breakdown em projeto inativo
- Resposta clara ao usuário

---

### 4.3 RANKING DE PROJETOS (TOP PROJECTS)

**Arquivo:** `backend/tests/integration/analytics/top-projects.spec.ts`

#### TC-E2E-003: Retorna ranking de projetos baseado no valor comprometido
**Prioridade:** ALTA  
**Nível de Risco:** MÉDIO  
**Pré-condições:** 
- Projetos com valores diferentes
- Seeds executados

**Dados de Teste:**
```
(utiliza dados de seed)
```

**Passos do Teste:**
- **Método:** GET `/v1/analytics/top-projects`
- **Quando:** Request com token ADMIN
- **Então:** 
  - Status HTTP: 200 OK
  - Array ordenado por `totalValue` DESC
  - Primeiro item: "Pesquisa em IA Aplicada"

**Resultado Esperado:** 
- Lista retorna projetos ordenados corretamente
- Formato: `[{ id, name, totalRequests, totalValue }, ...]`

---

#### TC-E2E-004: Respeita o limite de resultados
**Prioridade:** MÉDIA  
**Nível de Risco:** BAIXO  
**Pré-condições:** Mais de 1 projeto no banco

**Dados de Teste:**
```
limit: 1
```

**Passos do Teste:**
- **SETUP:** Cria despesa adicional com cost breakdown
- **Método:** GET `/v1/analytics/top-projects?limit=1`
- **Quando:** Request com token ADMIN
- **Então:** 
  - Status HTTP: 200 OK
  - Array com exatamente 1 item

**Resultado Esperado:** 
- Limite é respeitado
- Retorna apenas o top 1

---

#### TC-E2E-005: Usa contagem de requisições como critério de desempate
**Prioridade:** ALTA  
**Nível de Risco:** MÉDIO  
**Pré-condições:** Dois projetos com mesmo `totalValue`

**Dados de Teste:**
```
Projeto A: totalValue = 15000, requisições = 1
Projeto B (Robótica): totalValue = 15000 (após inserção), requisições = 2
```

**Passos do Teste:**
- **SETUP:**
  - Cria despesa com breakdown de 15000 para Projeto Robótica
  - Cria outra despesa (sem breakdown) para aumentar contagem
- **Método:** GET `/v1/analytics/top-projects`
- **Quando:** Request com token ADMIN
- **Então:** 
  - Status HTTP: 200 OK
  - Primeiro lugar: "Laboratório de Robótica Avançada" (mais requisições)
  - Segundo lugar: "Pesquisa em IA Aplicada"

**Resultado Esperado:** 
- Desempate por contagem funciona
- Projeto com mais requisições aparece primeiro

---

### 4.4 DASHBOARD ADMIN

**Arquivo:** `backend/tests/integration/analytics/admin-dashboard.spec.ts`

#### TC-E2E-006: Retorna 401 quando nenhum token é fornecido
**Prioridade:** CRÍTICA  
**Nível de Risco:** ALTO  
**Pré-condições:** Nenhuma

**Passos do Teste:**
- **Método:** GET `/v1/analytics/admin-dashboard`
- **Quando:** Request SEM token
- **Então:** Status HTTP: 401 Unauthorized

**Resultado Esperado:** 
- Endpoint protegido rejeita acesso não autenticado

---

#### TC-E2E-007: Retorna 403 quando um ALUNO tenta acessar
**Prioridade:** CRÍTICA  
**Nível de Risco:** ALTO  
**Pré-condições:** Token de ALUNO válido

**Passos do Teste:**
- **Método:** GET `/v1/analytics/admin-dashboard`
- **Quando:** Request com token ALUNO
- **Então:** Status HTTP: 403 Forbidden

**Resultado Esperado:** 
- Apenas ADMIN/COORDENADOR podem acessar

---

#### TC-E2E-008: Retorna estatísticas corretas e valores financeiros como string
**Prioridade:** CRÍTICA  
**Nível de Risco:** ALTO  
**Pré-condições:** 
- Seeds executados
- Token ADMIN

**Dados de Teste:**
```
(baseado em dummyExpenseCategories e dummyProjects)
expectedTotalValue: soma de todos os budgets
expectedBudgetCommitted: soma de todos os usedBudgets
```

**Passos do Teste:**
- **Método:** GET `/v1/analytics/admin-dashboard`
- **Quando:** Request com token ADMIN
- **Então:** 
  - Status HTTP: 200 OK
  - `totalRequests: 3`
  - `byStatus: { APROVADO: 1, REJEITADO: 1, PENDENTE: 1 }`
  - `totalValue` e `budgetCommitted` são strings
  - Valores correspondem aos seeds

**Resultado Esperado:**
```
{
  totalRequests: 3,
  byStatus: { APROVADO: 1, REJEITADO: 1, PENDENTE: 1 },
  totalValue: "105000", // soma dos budgets dos projetos
  budgetCommitted: "45000" // soma dos usedBudgets
}
```

---

## PARTE 5: COBERTURA DE USER STORIES DA SPRINT 2

### Mapeamento: Testes → User Stories

| User Story | Descrição | Testes Relacionados |
|------------|-----------|---------------------|
| **US7** | Gestão de Projetos (Admin) | TC-PROJ-001 a TC-PROJ-007 |
| **US8** | Atribuir Projeto a Despesa (Admin) | TC-ASSIGN-001 a TC-ASSIGN-004 |
| **US9** | Dashboard Admin com Métricas | TC-ANALYTICS-001 a TC-ANALYTICS-006, TC-E2E-006 a TC-E2E-008 |
| **US10** | Discriminação de Custos (Admin) | TC-BREAKDOWN-001 a TC-BREAKDOWN-006, TC-E2E-002 |
| **US11** | Rejeição com Motivo (Coordenador) | TC-E2E-001 (completo) |
| **US12** | Anexos em Solicitações (Aluno/Admin) | TC-STORAGE-001 a TC-STORAGE-005 |
| **Fluxo Completo Sprint 2** | Integração de todos os serviços | TC-FLOW-001 |

### Cobertura por Módulo

- **project.service.ts**: 7 casos de teste (100% das funções)
- **expense.service.ts** (atribuição): 4 casos de teste
- **budget.service.ts**: 6 casos de teste
- **analytics.service.ts**: 6 casos de teste
- **storage.ts**: 5 casos de teste (mocks)
- **Testes de Integração**: 8 cenários E2E

**Total de Casos de Teste Sprint 2:** 36 casos

---

## PARTE 6: EXECUÇÃO DOS TESTES

### Comandos

**Testes Unitários:**
```bash
cd testes/backend
npm test
```

**Testes de Integração:**
```bash
cd backend
npm run test:integration
```

**Todos os Testes:**
```bash
npm test
```

### Resultado Esperado da Execução

```
✓ testes/backend/project.service.test.ts (7 tests) 125ms
✓ testes/backend/project-assignment.service.test.ts (4 tests) 89ms
✓ testes/backend/admin-attachment.service.test.ts (5 tests) 67ms
✓ testes/backend/analytics.service.test.ts (6 tests) 112ms
✓ testes/backend/cost-breakdown.service.test.ts (6 tests) 78ms
✓ testes/backend/sprint2-flow.integration.test.ts (1 test) 145ms
✓ backend/tests/integration/expenses/rejection-flow.spec.ts (6 tests) 1234ms
✓ backend/tests/integration/cost-breakdown/archived-project.spec.ts (1 test) 456ms
✓ backend/tests/integration/analytics/top-projects.spec.ts (3 tests) 892ms
✓ backend/tests/integration/analytics/admin-dashboard.spec.ts (3 tests) 678ms

Test Files  10 passed (10)
     Tests  42 passed (42)
  Start at  22:14:00
  Duration  4.88s
```

---

## PARTE 7: CONSIDERAÇÕES FINAIS

### Limitações Conhecidas

1. **Storage R2**: Testes utilizam mocks devido à falta de credenciais R2 no CI. Testes locais com R2 real devem ser executados manualmente.

2. **Banco de Dados**: Testes de integração requerem PostgreSQL ativo. Seeds são aplicados e revertidos a cada execução.

3. **Memorando**: Funcionalidade de upload de memorando foi excluída dos testes de fluxo para compatibilidade com CI sem configuração R2.

### Próximos Passos

- Adicionar testes E2E para frontend (Playwright/Cypress)
- Testes de carga para endpoints de analytics
- Testes de segurança (SQL injection, XSS)
- Integração com SonarQube para análise de cobertura

### Autores

- Desenvolvido durante Sprint 2
- Framework: Vitest 4.1.4
- Última atualização: 03/05/2026

---

**FIM DA DOCUMENTAÇÃO**
