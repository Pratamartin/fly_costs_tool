# Plano de Implementação — US 4.3: Relatório de Despesas (Exportar PDF)

**Status:** Pendente  
**Sprint:** 4  
**Modo:** Mock (API ainda não implementada)

---

## Objetivo

Permitir que Admin e Coordenador exportem um relatório de despesas em PDF. O usuário clica em "Exportar PDF", um modal de filtros é exibido (período, status, projeto, aluno) e o download é acionado automaticamente ao confirmar. Enquanto o backend não tiver o endpoint, um PDF é gerado client-side a partir dos dados já carregados na tela.

---

## Arquitetura

```
services/expenses/index.ts            ← adicionar exportExpensesReport(filters)
components/ModalFiltroRelatorio.tsx   ← novo modal de filtros
lib/mockReportPdf.ts                  ← geração de PDF client-side (mock)
pages/dashboard/admin/expenses/index.tsx      ← botão + integração
pages/dashboard/coordinator/index.tsx         ← botão + integração
```

---

## Tipos e Contratos

```ts
// Em services/expenses/index.ts

export type ReportFilters = {
  startDate?: string    // ISO 8601, ex: "2025-01-01"
  endDate?: string      // ISO 8601, ex: "2025-12-31"
  status?: ExpenseStatus | "all"
  projectId?: string
  studentName?: string
}

export type ExportReportError = "UNAUTHORIZED" | "NOT_IMPLEMENTED" | "UNKNOWN"

export type ExportReportResult =
  | { ok: true; blob: Blob; filename: string }
  | { ok: false; error: ExportReportError }

export async function exportExpensesReport(
  token: string,
  filters: ReportFilters
): Promise<ExportReportResult>
```

---

## Etapas de Implementação

### Etapa 1 — Serviço com fallback mock (`services/expenses/index.ts`)

Adicionar `exportExpensesReport`:

```ts
// Flag de mock — trocar para false quando API estiver pronta
const MOCK_REPORT = true

export async function exportExpensesReport(
  token: string,
  filters: ReportFilters
): Promise<ExportReportResult> {
  if (MOCK_REPORT) {
    // importa dinamicamente para não pesar o bundle
    const { generateMockReportPdf } = await import("@/lib/mockReportPdf")
    const blob = await generateMockReportPdf(token, filters)
    const filename = `relatorio-despesas-${new Date().toISOString().slice(0, 10)}.pdf`
    return { ok: true, blob, filename }
  }

  const params = new URLSearchParams()
  if (filters.startDate) params.append("startDate", filters.startDate)
  if (filters.endDate) params.append("endDate", filters.endDate)
  if (filters.status && filters.status !== "all") params.append("status", filters.status)
  if (filters.projectId) params.append("projectId", filters.projectId)
  if (filters.studentName) params.append("studentName", filters.studentName)

  const res = await fetch(`${API_URL}/v1/expenses/report?${params.toString()}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  })

  if (res.status === 200) {
    const blob = await res.blob()
    const filename = `relatorio-despesas-${new Date().toISOString().slice(0, 10)}.pdf`
    return { ok: true, blob, filename }
  }
  if (res.status === 401) return { ok: false, error: "UNAUTHORIZED" }
  if (res.status === 404 || res.status === 501) return { ok: false, error: "NOT_IMPLEMENTED" }
  return { ok: false, error: "UNKNOWN" }
}
```

---

### Etapa 2 — Gerador de PDF client-side (`lib/mockReportPdf.ts`)

Usa `jsPDF` (instalar: `npm install jspdf`). Gera uma tabela simples com os dados já disponíveis via `listExpenses`.

```ts
// lib/mockReportPdf.ts
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"  // npm install jspdf-autotable
import { listExpenses, type ReportFilters } from "@/services/expenses"

export async function generateMockReportPdf(
  token: string,
  filters: ReportFilters
): Promise<Blob> {
  const result = await listExpenses(token, filters.status !== "all" ? filters.status : undefined)
  const expenses = result.ok ? result.data : []

  // Aplica filtros client-side
  const filtered = expenses.filter((e) => {
    if (filters.startDate && e.createdAt < filters.startDate) return false
    if (filters.endDate && e.createdAt > filters.endDate + "T23:59:59") return false
    if (filters.studentName && !e.student?.name.toLowerCase().includes(filters.studentName.toLowerCase())) return false
    if (filters.projectId && e.projectId !== filters.projectId) return false
    return true
  })

  const doc = new jsPDF({ orientation: "landscape" })

  doc.setFontSize(16)
  doc.text("Relatório de Despesas", 14, 18)
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 26)

  const statusLabels: Record<string, string> = {
    PENDENTE: "Pendente", APROVADO: "Aprovado", REJEITADO: "Rejeitado",
    EM_PROCESSAMENTO: "Em Processamento", EM_EDICAO: "Em Edição", CONCLUIDO: "Concluído",
  }

  autoTable(doc, {
    startY: 32,
    head: [["ID", "Título", "Aluno", "Destino", "Projeto", "Status", "Data"]],
    body: filtered.map((e) => [
      `REQ-${e.id.slice(0, 8).toUpperCase()}`,
      e.title,
      e.student?.name ?? "—",
      `${e.city}, ${e.state}`,
      e.project?.name ?? "—",
      statusLabels[e.status] ?? e.status,
      new Date(e.createdAt).toLocaleDateString("pt-BR"),
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 45, 61] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  })

  return doc.output("blob")
}
```

---

### Etapa 3 — Modal de filtros (`components/ModalFiltroRelatorio.tsx`)

Props:

```ts
interface ModalFiltroRelatorioProps {
  onClose: () => void
  onExportar: (filters: ReportFilters) => void
  exporting: boolean
  projects: { id: string; name: string }[]  // lista de projetos para o select
}
```

Campos do modal:
| Campo | Tipo | Label |
|-------|------|-------|
| `startDate` | `<input type="date">` | Data início |
| `endDate` | `<input type="date">` | Data fim |
| `status` | `<select>` | Status |
| `projectId` | `<select>` | Projeto |
| `studentName` | `<input type="text">` | Nome do aluno |

Botões: **Cancelar** / **Exportar PDF** (disabled + spinner quando `exporting === true`).

---

### Etapa 4 — Admin Expenses (`pages/dashboard/admin/expenses/index.tsx`)

1. Adicionar estado:
   ```ts
   const [showFilterModal, setShowFilterModal] = useState(false)
   const [exporting, setExporting] = useState(false)
   ```

2. Implementar `handleExport(filters)`:
   ```ts
   async function handleExport(filters: ReportFilters) {
     const token = localStorage.getItem("accessToken")
     if (!token) return
     setExporting(true)
     const result = await exportExpensesReport(token, filters)
     setExporting(false)
     setShowFilterModal(false)
     if (!result.ok) { setErro("Erro ao gerar relatório"); return }
     const url = URL.createObjectURL(result.blob)
     const a = document.createElement("a")
     a.href = url
     a.download = result.filename
     a.click()
     URL.revokeObjectURL(url)
   }
   ```

3. Adicionar botão "Exportar PDF" no header (ao lado da barra de busca):
   ```tsx
   <button
     onClick={() => setShowFilterModal(true)}
     className="flex items-center gap-2 rounded-lg bg-[#1e2d3d] px-3 py-2 text-sm font-semibold text-white hover:bg-[#2d3f52] transition"
   >
     <svg .../>  {/* ícone de download */}
     Exportar PDF
   </button>
   ```

4. Renderizar modal quando `showFilterModal`:
   ```tsx
   {showFilterModal && (
     <ModalFiltroRelatorio
       onClose={() => setShowFilterModal(false)}
       onExportar={handleExport}
       exporting={exporting}
       projects={/* lista já disponível ou buscar via listProjects */}
     />
   )}
   ```

> **Nota:** Para popular o select de projetos, buscar via `listProjects` na montagem do componente (já existe o serviço).

---

### Etapa 5 — Coordinator Dashboard (`pages/dashboard/coordinator/index.tsx`)

Mesmo fluxo do Admin. Diferença: no coordinator, os projetos podem ser passados como lista vazia ou buscados separadamente se necessário. O modal de filtros é o mesmo componente compartilhado.

---

## Fluxo do Usuário

```
[Usuário clica "Exportar PDF"]
        ↓
[ModalFiltroRelatorio abre]
        ↓
[Preenche filtros (opcional) → clica "Exportar PDF"]
        ↓
[Botão entra em loading — spinner visível]
        ↓
[exportExpensesReport chamado]
  ├─ MOCK_REPORT=true → generateMockReportPdf → blob
  └─ MOCK_REPORT=false → GET /v1/expenses/report → blob
        ↓
[URL.createObjectURL → <a>.click() → download automático]
        ↓
[Modal fecha — loading encerra]
```

---

## Dependências a Instalar

```bash
npm install jspdf jspdf-autotable
```

> `jspdf-autotable` para geração de tabelas. Ambos são client-only (sem SSR issue no Next.js com dynamic import).

---

## Integração com API Real (futuro)

Quando o endpoint `GET /v1/expenses/report` for implementado no backend:

1. Mudar `const MOCK_REPORT = false` em `services/expenses/index.ts`
2. Garantir que a API retorne `Content-Type: application/pdf`
3. Confirmar parâmetros: `startDate`, `endDate`, `status`, `projectId`, `studentName`

---

## Arquivos Afetados

| Arquivo | Tipo de mudança |
|---------|----------------|
| `services/expenses/index.ts` | Adicionar `exportExpensesReport` + tipos |
| `lib/mockReportPdf.ts` | Novo arquivo |
| `components/ModalFiltroRelatorio.tsx` | Novo componente |
| `pages/dashboard/admin/expenses/index.tsx` | Botão + lógica de export |
| `pages/dashboard/coordinator/index.tsx` | Botão + lógica de export |

---

## Critérios de Aceite

- [ ] Botão "Exportar PDF" visível no header das telas Admin e Coordinator
- [ ] Modal de filtros abre com campos: data início, data fim, status, projeto, aluno
- [ ] Botão "Exportar PDF" no modal mostra spinner durante geração
- [ ] Download automático do arquivo `.pdf` é acionado ao confirmar
- [ ] Mock gera PDF com tabela de despesas filtradas client-side
- [ ] Quando API disponível (`MOCK_REPORT=false`), usa endpoint real
- [ ] Erro de geração exibe mensagem na tela sem quebrar o fluxo
