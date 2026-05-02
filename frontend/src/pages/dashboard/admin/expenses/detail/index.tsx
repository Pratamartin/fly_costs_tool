import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminSidebar from "@/components/AdminSidebar";
import ModalRejeitar from "@/components/ModalRejeitar";
import {
  getExpenseById,
  updateExpenseStatus,
  assignProject,
  createCostBreakdown,
  type Expense,
} from "@/services/expenses";
import { listProjects, type Project } from "@/services/projects";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function StatusBanner({ expense }: { expense: Expense }) {
  const date = fmtDate(expense.createdAt);

  if (expense.status === "PENDENTE") {
    return (
      <div className="flex items-center justify-between rounded-xl border-l-4 border-orange-400 bg-orange-50 px-6 py-4 mb-5">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="h-5 w-5">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-orange-700">Aguardando Revisão</p>
            <p className="text-sm text-orange-600">Esta despesa está aguardando sua decisão de aprovação</p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs font-semibold text-orange-500">Enviado em</p>
          <p className="text-sm font-bold text-orange-800">{date}</p>
        </div>
      </div>
    );
  }

  if (expense.status === "APROVADO") {
    return (
      <div className="flex items-center justify-between rounded-xl border-l-4 border-green-500 bg-green-50 px-6 py-4 mb-5">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-500">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="h-5 w-5">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-green-700">Aprovado</p>
            <p className="text-sm text-green-600">Despesa aprovada. Vincule um projeto para prosseguir.</p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs font-semibold text-green-500">Enviado em</p>
          <p className="text-sm font-bold text-green-800">{date}</p>
        </div>
      </div>
    );
  }

  if (expense.status === "EM_PROCESSAMENTO") {
    return (
      <div className="flex items-center justify-between rounded-xl border-l-4 border-blue-500 bg-blue-50 px-6 py-4 mb-5">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="h-5 w-5">
              <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-blue-700">Em Processamento</p>
            <p className="text-sm text-blue-600">Projeto vinculado. Adicione a discriminação de custos.</p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs font-semibold text-blue-500">Enviado em</p>
          <p className="text-sm font-bold text-blue-800">{date}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between rounded-xl border-l-4 border-red-500 bg-red-50 px-6 py-4 mb-5">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-500 mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="h-5 w-5">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <p className="font-bold text-red-700">Rejeitado</p>
          {expense.rejectionReason ? (
            <p className="text-sm text-red-600 mt-0.5 max-w-prose">
              <span className="font-semibold">Motivo: </span>{expense.rejectionReason}
            </p>
          ) : (
            <p className="text-sm text-red-600">Esta despesa foi rejeitada</p>
          )}
        </div>
      </div>
      <div className="text-right hidden sm:block shrink-0 ml-4">
        <p className="text-xs font-semibold text-red-500">Enviado em</p>
        <p className="text-sm font-bold text-red-800">{date}</p>
      </div>
    </div>
  );
}

export default function ExpenseDetalhe() {
  const router = useRouter();
  const { id } = router.query;

  const [expense, setExpense] = useState<Expense | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [showModalRejeitar, setShowModalRejeitar] = useState(false);
  const [aprovando, setAprovando] = useState(false);
  const [rejeitando, setRejeitando] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [vinculando, setVinculando] = useState(false);
  const [erroVincular, setErroVincular] = useState<string | null>(null);

  const [cbSubcategoria, setCbSubcategoria] = useState("");
  const [cbValor, setCbValor] = useState("");
  const [adicionandoCusto, setAdicionandoCusto] = useState(false);
  const [erroCusto, setErroCusto] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) { router.push("/login"); return; }
    if (!id || typeof id !== "string") return;
    carregarDados(token, id);
  }, [router, id]);

  async function carregarDados(token: string, expId: string) {
    setCarregando(true);
    const result = await getExpenseById(token, expId);
    if (result.ok) {
      setExpense(result.data);
      if (result.data.status === "APROVADO") {
        const projResult = await listProjects(token, { isActive: true });
        if (projResult.ok) setProjects(projResult.data);
      }
    } else if (result.error === "UNAUTHORIZED") {
      localStorage.removeItem("accessToken");
      router.push("/login");
    } else if (result.error === "NOT_FOUND") {
      setErro("Despesa não encontrada.");
    } else {
      setErro("Erro ao carregar despesa.");
    }
    setCarregando(false);
  }

  async function handleAprovar() {
    const token = localStorage.getItem("accessToken");
    if (!token || !expense) return;
    setAprovando(true);
    setErro(null);
    const result = await updateExpenseStatus(token, expense.id, "APROVADO");
    setAprovando(false);
    if (result.ok) {
      setExpense(result.data);
      const projResult = await listProjects(token, { isActive: true });
      if (projResult.ok) setProjects(projResult.data);
    } else {
      setErro("Erro ao aprovar despesa.");
    }
  }

  async function handleRejeitar(motivo: string) {
    const token = localStorage.getItem("accessToken");
    if (!token || !expense) return;
    setRejeitando(true);
    const result = await updateExpenseStatus(token, expense.id, "REJEITADO", motivo);
    setRejeitando(false);
    if (result.ok) {
      setExpense(result.data);
      setShowModalRejeitar(false);
    } else {
      setErro("Erro ao rejeitar despesa.");
    }
  }

  async function handleVincularProjeto() {
    const token = localStorage.getItem("accessToken");
    if (!token || !expense || !selectedProjectId) return;
    setVinculando(true);
    setErroVincular(null);
    const result = await assignProject(token, expense.id, selectedProjectId);
    setVinculando(false);
    if (result.ok) {
      setExpense(result.data);
    } else if (result.error === "CONFLICT") {
      setErroVincular("Esta despesa já está vinculada a um projeto.");
    } else {
      setErroVincular("Erro ao vincular projeto. Tente novamente.");
    }
  }

  async function handleAdicionarCusto(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("accessToken");
    if (!token || !expense) return;
    const amount = parseFloat(cbValor);
    if (!cbSubcategoria.trim() || isNaN(amount) || amount <= 0) return;
    setAdicionandoCusto(true);
    setErroCusto(null);
    const result = await createCostBreakdown(token, expense.id, {
      subcategoryName: cbSubcategoria.trim(),
      amount,
    });
    setAdicionandoCusto(false);
    if (result.ok) {
      const updated = await getExpenseById(token, expense.id);
      if (updated.ok) setExpense(updated.data);
      setCbSubcategoria("");
      setCbValor("");
    } else if (result.error === "BAD_REQUEST") {
      setErroCusto("Rubrica inválida para este projeto.");
    } else if (result.error === "CONFLICT") {
      setErroCusto("Esta rubrica já foi adicionada.");
    } else {
      setErroCusto("Erro ao adicionar custo.");
    }
  }

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
          <p className="text-gray-600">Carregando despesa...</p>
        </div>
      </div>
    );
  }

  if (erro && !expense) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 font-medium">{erro}</p>
          <button
            onClick={() => router.push("/dashboard/admin/expenses")}
            className="mt-4 text-sm text-blue-600 hover:underline"
          >
            Voltar para lista
          </button>
        </div>
      </div>
    );
  }

  if (!expense) return null;

  const displayId = `REQ-${expense.id.slice(0, 8).toUpperCase()}`;
  const totalCusto = (expense.costBreakdowns ?? []).reduce((sum, cb) => sum + cb.amount, 0);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <AdminSidebar active="expenses" />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex flex-col gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard/admin/expenses")}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
              </svg>
            </button>
            <div>
              <h1 className="text-base font-bold text-gray-900 sm:text-xl">Detalhes da Despesa</h1>
              <p className="text-xs text-gray-500 sm:text-sm">
                {displayId} • {expense.title}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {erro && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5">
                <p className="text-xs text-red-700">{erro}</p>
              </div>
            )}
            {expense.status === "PENDENTE" && (
              <>
                <button
                  onClick={handleAprovar}
                  disabled={aprovando}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-60 sm:px-4"
                >
                  {aprovando ? (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                  )}
                  Aprovar
                </button>
                <button
                  onClick={() => setShowModalRejeitar(true)}
                  disabled={rejeitando}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-60 sm:px-4"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                  Rejeitar
                </button>
              </>
            )}
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6">
          <StatusBanner expense={expense} />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Left column */}
            <div className="col-span-1 space-y-5 lg:col-span-2">

              {/* Expense Overview */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-blue-500">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <h2 className="text-sm font-bold text-gray-800">Visão Geral da Despesa</h2>
                </div>

                <div className="grid grid-cols-1 gap-5 mb-5 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">ID da Despesa</p>
                    <p className="text-sm font-bold text-blue-600">{displayId}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">Título</p>
                    <p className="text-sm font-semibold text-gray-800">{expense.title}</p>
                  </div>
                </div>

                {expense.description && (
                  <div className="mb-5">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Descrição</p>
                    <p className="text-sm leading-relaxed text-gray-600">{expense.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Destino</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {expense.city}, {expense.state}
                      {expense.country && expense.country !== "BR" && ` — ${expense.country}`}
                    </p>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Período</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {fmtDate(expense.departureDate)} → {fmtDate(expense.returnDate)}
                    </p>
                  </div>
                </div>

                {totalCusto > 0 && (
                  <div className="mt-5 pt-5 border-t border-gray-100">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">Total de Custos Registrados</p>
                    <p className="text-2xl font-bold text-gray-900">{fmtCurrency(totalCusto)}</p>
                  </div>
                )}
              </div>

              {/* Vincular Projeto — only when APROVADO */}
              {expense.status === "APROVADO" && (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-blue-500">
                      <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                      <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                    </svg>
                    <h2 className="text-sm font-bold text-gray-800">Vincular Projeto</h2>
                  </div>

                  <p className="text-sm text-gray-500 mb-4">
                    Selecione o projeto que irá financiar esta despesa. Após vinculação, o status passa para <strong>Em Processamento</strong>.
                  </p>

                  <div className="mb-4">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">Projeto Financiador</label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => { setSelectedProjectId(e.target.value); setErroVincular(null); }}
                      className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 pl-3 pr-8 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                    >
                      <option value="">Selecionar projeto...</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.code})
                        </option>
                      ))}
                    </select>
                    {projects.length === 0 && (
                      <p className="mt-1.5 text-xs text-gray-400">Nenhum projeto ativo disponível.</p>
                    )}
                  </div>

                  {erroVincular && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                      <p className="text-sm text-red-700">{erroVincular}</p>
                    </div>
                  )}

                  <button
                    onClick={handleVincularProjeto}
                    disabled={!selectedProjectId || vinculando}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    {vinculando ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Vinculando...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                          <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z" />
                          <path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 105.656 5.656l3-3a4 4 0 00-.225-5.865z" />
                        </svg>
                        Vincular Projeto
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Discriminação de Custos — only when EM_PROCESSAMENTO */}
              {expense.status === "EM_PROCESSAMENTO" && (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-blue-500">
                      <path fillRule="evenodd" d="M1 4a1 1 0 011-1h16a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4zm12 4a3 3 0 11-6 0 3 3 0 016 0zM4 9a1 1 0 100-2 1 1 0 000 2zm13-1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                    </svg>
                    <h2 className="text-sm font-bold text-gray-800">Discriminação de Custos</h2>
                    {(expense.costBreakdowns ?? []).length > 0 && (
                      <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                        {expense.costBreakdowns!.length} rubrica{expense.costBreakdowns!.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* Existing breakdowns */}
                  {(expense.costBreakdowns ?? []).length > 0 ? (
                    <div className="mb-6">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pb-2">Rubrica</th>
                            <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider pb-2">Valor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {expense.costBreakdowns!.map((cb) => (
                            <tr key={cb.id}>
                              <td className="py-2.5 font-medium text-gray-700">{cb.subcategory.name}</td>
                              <td className="py-2.5 text-right font-semibold text-gray-900">{fmtCurrency(cb.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-gray-200">
                            <td className="pt-3 text-sm font-bold text-gray-700">Total</td>
                            <td className="pt-3 text-right text-sm font-bold text-gray-900">{fmtCurrency(totalCusto)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 mb-5">Nenhuma rubrica adicionada ainda.</p>
                  )}

                  {/* Add new breakdown */}
                  <div className="border-t border-gray-100 pt-5">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Adicionar Rubrica</p>
                    <form onSubmit={handleAdicionarCusto} className="space-y-3">
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Nome da rubrica"
                            value={cbSubcategoria}
                            onChange={(e) => { setCbSubcategoria(e.target.value); setErroCusto(null); }}
                            disabled={adicionandoCusto}
                            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-60 transition"
                          />
                        </div>
                        <div className="w-36">
                          <div className="relative">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-gray-400">R$</span>
                            <input
                              type="number"
                              placeholder="0,00"
                              min="0.01"
                              step="0.01"
                              value={cbValor}
                              onChange={(e) => { setCbValor(e.target.value); setErroCusto(null); }}
                              disabled={adicionandoCusto}
                              className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 pl-9 pr-3 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-60 transition"
                            />
                          </div>
                        </div>
                      </div>

                      {erroCusto && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                          <p className="text-sm text-red-700">{erroCusto}</p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={adicionandoCusto || !cbSubcategoria.trim() || !cbValor}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        {adicionandoCusto ? (
                          <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Adicionando...
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                            </svg>
                            Adicionar Rubrica
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>

            {/* Right sidebar */}
            <div className="space-y-5">

              {/* Submitted By */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-blue-500">
                    <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                  </svg>
                  <h3 className="text-sm font-bold text-gray-800">Solicitante</h3>
                </div>

                {expense.student ? (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-base font-bold text-white">
                      {expense.student.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{expense.student.name}</p>
                      <p className="text-xs text-gray-400">Aluno</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">—</p>
                )}
              </div>

              {/* Travel Details */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-blue-500">
                    <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.452-.23.773-.417.635-.374 1.52-.965 2.396-1.763C15.281 15.523 17 13.687 17 11a7 7 0 10-14 0c0 2.687 1.719 4.523 3.216 5.855a19.032 19.032 0 002.396 1.763 11.46 11.46 0 00.773.417 5.75 5.75 0 00.281.14l.018.008.006.003zM10 13a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <h3 className="text-sm font-bold text-gray-800">Detalhes da Viagem</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Destino</p>
                    <p className="mt-0.5 text-sm font-semibold text-gray-800">
                      {expense.city}, {expense.state}
                      {expense.country && expense.country !== "BR" && `, ${expense.country}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Partida</p>
                    <p className="mt-0.5 text-sm font-semibold text-gray-800">{fmtDate(expense.departureDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Retorno</p>
                    <p className="mt-0.5 text-sm font-semibold text-gray-800">{fmtDate(expense.returnDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Criado em</p>
                    <p className="mt-0.5 text-sm text-gray-600">{fmtDate(expense.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Assigned Project */}
              {expense.project && (
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-blue-500">
                      <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                      <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                    </svg>
                    <h3 className="text-sm font-bold text-gray-800">Projeto Vinculado</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Nome</p>
                      <p className="mt-0.5 text-sm font-semibold text-gray-800">{expense.project.name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Código</p>
                      <span className="mt-0.5 inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-mono font-semibold text-gray-700">
                        {expense.project.code}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push({ pathname: "/dashboard/admin/projects/detail", query: { id: expense.project!.id } })}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                    Ver Projeto
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {showModalRejeitar && (
        <ModalRejeitar
          solicitacao={{
            reqId: displayId,
            descricao: expense.title,
            valor: totalCusto,
            aluno: expense.student?.name,
          }}
          onClose={() => setShowModalRejeitar(false)}
          onConfirmar={handleRejeitar}
        />
      )}
    </div>
  );
}
