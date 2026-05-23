import { listExpenses, type ReportFilters } from "@/services/expenses"

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: "Pendente",
  APROVADO: "Aprovado",
  REJEITADO: "Rejeitado",
  EM_PROCESSAMENTO: "Em Processamento",
  EM_EDICAO: "Em Edição",
  CONCLUIDO: "Concluído",
}

export async function generateMockReportPdf(
  token: string,
  filters: ReportFilters
): Promise<Blob> {
  const { default: jsPDF } = await import("jspdf")
  const { default: autoTable } = await import("jspdf-autotable")

  const result = await listExpenses(token, filters.status && filters.status !== "all" ? filters.status : undefined)
  const expenses = result.ok ? result.data : []

  const filtered = expenses.filter((e) => {
    if (filters.startDate && e.createdAt < filters.startDate) return false
    if (filters.endDate && e.createdAt > filters.endDate + "T23:59:59") return false
    if (filters.studentName && !e.student?.name.toLowerCase().includes(filters.studentName.toLowerCase())) return false
    if (filters.projectId && e.projectId !== filters.projectId) return false
    return true
  })

  const doc = new jsPDF({ orientation: "landscape" })

  doc.setFontSize(16)
  doc.setTextColor(30, 45, 61)
  doc.text("Relatório de Despesas", 14, 18)

  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 26)

  const filterParts: string[] = []
  if (filters.startDate) filterParts.push(`De: ${new Date(filters.startDate).toLocaleDateString("pt-BR")}`)
  if (filters.endDate) filterParts.push(`Até: ${new Date(filters.endDate).toLocaleDateString("pt-BR")}`)
  if (filters.status && filters.status !== "all") filterParts.push(`Status: ${STATUS_LABELS[filters.status] ?? filters.status}`)
  if (filters.studentName) filterParts.push(`Aluno: ${filters.studentName}`)
  if (filterParts.length > 0) {
    doc.text(`Filtros: ${filterParts.join("  |  ")}`, 14, 32)
  }

  const startY = filterParts.length > 0 ? 38 : 32

  autoTable(doc, {
    startY,
    head: [["ID", "Título", "Aluno", "Destino", "Projeto", "Status", "Data Criação"]],
    body: filtered.map((e) => [
      `REQ-${e.id.slice(0, 8).toUpperCase()}`,
      e.title,
      e.student?.name ?? "—",
      `${e.city}, ${e.state}`,
      e.project?.name ?? "—",
      STATUS_LABELS[e.status] ?? e.status,
      new Date(e.createdAt).toLocaleDateString("pt-BR"),
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [30, 45, 61], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 60 },
      2: { cellWidth: 40 },
      3: { cellWidth: 35 },
      4: { cellWidth: 40 },
      5: { cellWidth: 32 },
      6: { cellWidth: 25 },
    },
  })

  const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
      `Página ${i} de ${pageCount}  —  ${filtered.length} despesa${filtered.length !== 1 ? "s" : ""}`,
      doc.internal.pageSize.getWidth() - 14,
      doc.internal.pageSize.getHeight() - 8,
      { align: "right" }
    )
  }

  return doc.output("blob")
}
