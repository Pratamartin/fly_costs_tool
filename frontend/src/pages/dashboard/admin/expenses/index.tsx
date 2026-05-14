import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminSidebar from "@/components/AdminSidebar";
import ModalRejeitar from "@/components/ModalRejeitar";
import { listExpenses, updateExpenseStatus, type Expense, type ExpenseStatus } from "@/services/expenses";

type StatusFilter = "all" | ExpenseStatus;
type ViewMode = "table" | "grid";

const AVATAR_COLORS: Record<string, string> = {
  A: "bg-pink-500", B: "bg-indigo-500", C: "bg-sky-500", D: "bg-violet-500",
  E: "bg-emerald-500", F: "bg-rose-500", G: "bg-teal-500", H: "bg-orange-500",
  I: "bg-blue-500", J: "bg-purple-500", K: "bg-green-500", L: "bg-red-500",
  M: "bg-amber-500", N: "bg-cyan-500", O: "bg-teal-500", P: "bg-rose-500",
};

function Avatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${AVATAR_COLORS[initial] ?? "bg-gray-500"} text-xs font-bold text-white`}>
      {initial}
    </div>
  );
}

function StatusBadge({ status }: { status: ExpenseStatus }) {
  const config: Record<ExpenseStatus, { bg: string; ring: string; text: string; dot: string; label: string }> = {
    PENDENTE:         { bg: "bg-yellow-50", ring: "ring-yellow-200", text: "text-yellow-700", dot: "bg-yellow-500",  label: "Pendente" },
    APROVADO:         { bg: "bg-green-50",  ring: "ring-green-200",  text: "text-green-700",  dot: "bg-green-500",   label: "Aprovado" },
    REJEITADO:        { bg: "bg-red-50",    ring: "ring-red-200",    text: "text-red-700",    dot: "bg-red-500",     label: "Rejeitado" },
    EM_PROCESSAMENTO: { bg: "bg-blue-50",   ring: "ring-blue-200",   text: "text-blue-700",   dot: "bg-blue-500",    label: "Em Processamento" },
    EM_EDICAO:        { bg: "bg-amber-50",  ring: "ring-amber-200",  text: "text-amber-700",  dot: "bg-amber-500",   label: "Em Edição" },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${c.bg} px-2.5 py-1 text-xs font-semibold ${c.text} ring-1 ring-inset ${c.ring}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminExpenses() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [rejeitando, setRejeitando] = useState<Expense | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState("recent");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 8;

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) { router.push("/login"); return; }
    carregarDespesas(token);
  }, [router]);

  async function carregarDespesas(token: string) {
    setCarregando(true);
    const result = await listExpenses(token);
    if (result.ok) {
      setExpenses(result.data);
    } else if (result.error === "UNAUTHORIZED") {
      localStorage.removeItem("accessToken");
      router.push("/login");
    } else {
      setErro("Erro ao carregar despesas");
    }
    setCarregando(false);
  }

  async function handleApprove(id: string) {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    const result = await updateExpenseStatus(token, id, "APROVADO");
    if (result.ok) {
      setExpenses((prev) => prev.map((e) => e.id === id ? result.data : e));
    } else {
      setErro("Erro ao aprovar despesa");
    }
  }

  async function handleReject(id: string, motivo: string) {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    const result = await updateExpenseStatus(token, id, "REJEITADO", motivo);
    if (result.ok) {
      setExpenses((prev) => prev.map((e) => e.id === id ? result.data : e));
      setRejeitando(null);
    } else {
      setErro("Erro ao rejeitar despesa");
    }
  }

  function handleSelectAll(checked: boolean) {
    if (checked) setSelected(new Set(filtered.map((e) => e.id)));
    else setSelected(new Set());
  }

  function handleSelectOne(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  const filtered = expenses
    .filter((e) => {
      if (filterStatus !== "all" && e.status !== filterStatus) return false;
      const q = search.toLowerCase();
      if (q && !e.id.toLowerCase().includes(q) &&
        !e.title.toLowerCase().includes(q) &&
        !(e.student?.name ?? "").toLowerCase().includes(q) &&
        !(e.project?.name ?? "").toLowerCase().includes(q)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "recent") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const totalCount = expenses.length;
  const pendingCount = expenses.filter((e) => e.status === "PENDENTE").length;
  const approvedCount = expenses.filter((e) => e.status === "APROVADO").length;
  const rejectedCount = expenses.filter((e) => e.status === "REJEITADO").length;
  const emEdicaoCount = expenses.filter((e) => e.status === "EM_EDICAO").length;

  if (carregando) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="text-gray-600">Carregando despesas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <AdminSidebar active="expenses" />

      {rejeitando && (
        <ModalRejeitar
          solicitacao={{
            descricao: rejeitando.title,
            reqId: `REQ-${rejeitando.id.slice(0, 8).toUpperCase()}`,
            valor: rejeitando.costBreakdowns?.reduce((s, cb) => s + cb.amount, 0) ?? 0,
            aluno: rejeitando.student?.name,
          }}
          onClose={() => setRejeitando(null)}
          onConfirmar={(motivo) => handleReject(rejeitando.id, motivo)}
        />
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex flex-col gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-4">
          <div>
            <h1 className="text-base font-bold text-gray-900 sm:text-xl">Solicitações de Despesas</h1>
            <p className="text-xs text-gray-500 sm:text-sm">Gerencie e revise todas as solicitações de despesas dos projetos</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {erro && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5">
                <p className="text-xs text-red-700">{erro}</p>
              </div>
            )}
            <div className="relative flex-1 sm:flex-none">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                </svg>
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Pesquisar despesas..."
                className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-9 pr-4 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#1e2d3d] focus:ring-1 focus:ring-[#1e2d3d] sm:w-56"
              />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6 space-y-5">
          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-blue-600">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-blue-500">Todos</span>
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900">{totalCount}</p>
              <p className="text-sm text-gray-500">Total de Despesas</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-orange-500">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-orange-500">Urgente</span>
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900">{pendingCount}</p>
              <p className="text-sm text-gray-500">Aguardando Revisão</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-green-600">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-green-600">Total</span>
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900">{approvedCount}</p>
              <p className="text-sm text-gray-500">Aprovadas</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-red-500">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-red-500">Total</span>
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900">{rejectedCount}</p>
              <p className="text-sm text-gray-500">Rejeitadas</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-amber-500">
                    <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-amber-500">Edição</span>
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900">{emEdicaoCount}</p>
              <p className="text-sm text-gray-500">Em Edição</p>
            </div>
          </div>

          {/* Filter & view toggle */}
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value as StatusFilter); setCurrentPage(1); }}
                  className="rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-700 outline-none focus:border-[#1e2d3d] focus:ring-1 focus:ring-[#1e2d3d]"
                >
                  <option value="all">Todos os Status</option>
                  <option value="PENDENTE">Pendente</option>
                  <option value="APROVADO">Aprovado</option>
                  <option value="REJEITADO">Rejeitado</option>
                  <option value="EM_PROCESSAMENTO">Em Processamento</option>
                  <option value="EM_EDICAO">Em Edição</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Ordenar por</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-700 outline-none focus:border-[#1e2d3d] focus:ring-1 focus:ring-[#1e2d3d]"
                >
                  <option value="recent">Mais Recente</option>
                </select>
              </div>
              <div className="flex items-end ml-auto">
                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setViewMode("table")}
                    className={`p-2 transition ${viewMode === "table" ? "bg-[#2563EB] text-white" : "text-gray-400 hover:bg-gray-50"}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M.99 5.24A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25l.01 9.5A2.25 2.25 0 0116.76 17H3.26A2.272 2.272 0 011 14.75l-.01-9.51zM2.5 9v5.25c0 .414.336.75.75.75H7V9H2.5zm4.5 0v6H17V9H7zm0-2.5v2H17V6.5H7zm-4.5 0v2H7v-2H2.5z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 transition ${viewMode === "grid" ? "bg-[#2563EB] text-white" : "text-gray-400 hover:bg-gray-50"}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v2.5A2.25 2.25 0 004.25 9h2.5A2.25 2.25 0 009 6.75v-2.5A2.25 2.25 0 006.75 2h-2.5zm0 9A2.25 2.25 0 002 13.25v2.5A2.25 2.25 0 004.25 18h2.5A2.25 2.25 0 009 15.75v-2.5A2.25 2.25 0 006.75 11h-2.5zm6.5-9A2.25 2.25 0 008.5 4.25v2.5A2.25 2.25 0 0010.75 9h2.5A2.25 2.25 0 0015.5 6.75v-2.5A2.25 2.25 0 0013.25 2h-2.5zm0 9a2.25 2.25 0 00-2.25 2.25v2.5A2.25 2.25 0 0010.75 18h2.5a2.25 2.25 0 002.25-2.25v-2.5A2.25 2.25 0 0013.25 11h-2.5z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Table / Grid */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-800">Solicitações de Despesas</h2>
                <p className="text-xs text-gray-400">Exibindo {filtered.length} despesas no total</p>
              </div>
            </div>

            {viewMode === "table" ? (
              <>
                <table className="hidden w-full md:table">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selected.size === paginated.length && paginated.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Solicitação</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Aluno</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Destino</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Data</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-sm text-gray-400">
                          Nenhuma despesa encontrada com os filtros aplicados.
                        </td>
                      </tr>
                    ) : paginated.map((expense) => (
                      <tr key={expense.id} className={`hover:bg-gray-50 transition-colors ${selected.has(expense.id) ? "bg-blue-50/40" : ""}`}>
                        <td className="px-6 py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(expense.id)}
                            onChange={(e) => handleSelectOne(expense.id, e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => router.push({ pathname: "/dashboard/admin/expenses/detail", query: { id: expense.id } })}
                            className="text-sm font-semibold text-[#2563EB] hover:underline whitespace-nowrap"
                          >
                            REQ-{expense.id.slice(0, 8).toUpperCase()}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-800">{expense.title}</p>
                          <p className="text-xs text-gray-400">{expense.project?.name ?? "Sem projeto"}</p>
                        </td>
                        <td className="px-4 py-3">
                          {expense.student ? (
                            <div className="flex items-center gap-2">
                              <Avatar name={expense.student.name} />
                              <p className="text-sm font-medium text-gray-800">{expense.student.name}</p>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-700">{expense.city}</p>
                          <p className="text-xs text-gray-400">{expense.state} · {expense.country}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-sm text-gray-700">{formatDate(expense.createdAt)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={expense.status} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => router.push({ pathname: "/dashboard/admin/expenses/detail", query: { id: expense.id } })}
                              title="Ver detalhes"
                              className="rounded-lg p-1.5 text-blue-400 hover:bg-blue-50 hover:text-blue-600 transition"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                                <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41z" clipRule="evenodd" />
                              </svg>
                            </button>
                            {expense.status === "PENDENTE" && (
                              <>
                                <button
                                  onClick={() => handleApprove(expense.id)}
                                  title="Aprovar"
                                  className="rounded-lg p-1.5 text-green-400 hover:bg-green-50 hover:text-green-600 transition"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => setRejeitando(expense)}
                                  title="Rejeitar"
                                  className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 transition"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
                  <p className="text-sm text-gray-400">
                    {filtered.length > 0
                      ? `Exibindo ${Math.min((currentPage - 1) * perPage + 1, filtered.length)}–${Math.min(currentPage * perPage, filtered.length)} de ${filtered.length} resultados`
                      : "Nenhum resultado"}
                  </p>
                  <div className="flex items-center gap-2">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" /></svg>
                    </button>
                    <span className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700">{currentPage} / {totalPages || 1}</span>
                    <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                </div>

                {/* Cards — mobile */}
                <div className="md:hidden divide-y divide-gray-100">
                  {paginated.length === 0 ? (
                    <p className="py-12 text-center text-sm text-gray-400">Nenhuma despesa encontrada.</p>
                  ) : paginated.map((expense) => (
                    <div key={expense.id} className={`px-4 py-4 hover:bg-gray-50 ${selected.has(expense.id) ? "bg-blue-50/40" : ""}`}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <button onClick={() => router.push({ pathname: "/dashboard/admin/expenses/detail", query: { id: expense.id } })} className="text-sm font-semibold text-[#2563EB] hover:underline">
                          REQ-{expense.id.slice(0, 8).toUpperCase()}
                        </button>
                        <StatusBadge status={expense.status} />
                      </div>
                      <p className="text-sm font-medium text-gray-800 mb-0.5">{expense.title}</p>
                      <p className="text-xs text-gray-400 mb-2">{expense.project?.name ?? "Sem projeto"} · {expense.city}, {expense.state}</p>
                      <div className="flex items-center justify-between">
                        {expense.student && (
                          <div className="flex items-center gap-2">
                            <Avatar name={expense.student.name} />
                            <p className="text-xs font-medium text-gray-700">{expense.student.name}</p>
                          </div>
                        )}
                        <p className="text-xs text-gray-400">{formatDate(expense.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-6">
                {paginated.length === 0 ? (
                  <p className="py-16 text-center text-sm text-gray-400">Nenhuma despesa encontrada.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
                    {paginated.map((expense) => (
                      <div key={expense.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <button onClick={() => router.push({ pathname: "/dashboard/admin/expenses/detail", query: { id: expense.id } })} className="text-sm font-semibold text-[#2563EB] hover:underline">
                            REQ-{expense.id.slice(0, 8).toUpperCase()}
                          </button>
                          <StatusBadge status={expense.status} />
                        </div>
                        <p className="text-sm font-semibold text-gray-900 mb-0.5">{expense.title}</p>
                        <p className="text-xs text-gray-400 mb-3">{expense.city}, {expense.state} · {expense.country}</p>
                        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                          {expense.student ? (
                            <div className="flex items-center gap-2">
                              <Avatar name={expense.student.name} />
                              <p className="text-xs font-medium text-gray-700">{expense.student.name}</p>
                            </div>
                          ) : <span />}
                          <div className="flex items-center gap-1">
                            <button onClick={() => router.push({ pathname: "/dashboard/admin/expenses/detail", query: { id: expense.id } })} className="rounded-lg p-1 text-blue-400 hover:bg-blue-50 transition">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41z" clipRule="evenodd" /></svg>
                            </button>
                            {expense.status === "PENDENTE" && (
                              <>
                                <button onClick={() => handleApprove(expense.id)} className="rounded-lg p-1 text-green-400 hover:bg-green-50 transition">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                                </button>
                                <button onClick={() => setRejeitando(expense)} className="rounded-lg p-1 text-red-400 hover:bg-red-50 transition">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                  <p className="text-sm text-gray-400">
                    {filtered.length > 0
                      ? `Exibindo ${Math.min((currentPage - 1) * perPage + 1, filtered.length)}–${Math.min(currentPage * perPage, filtered.length)} de ${filtered.length} resultados`
                      : "Nenhum resultado"}
                  </p>
                  <div className="flex items-center gap-2">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" /></svg>
                    </button>
                    <span className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700">{currentPage} / {totalPages || 1}</span>
                    <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
