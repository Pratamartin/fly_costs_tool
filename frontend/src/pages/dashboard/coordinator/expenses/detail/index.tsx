import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuthStore } from "@/store/authStore";
import { getToken } from "@/lib/getToken";
import CoordinatorSidebar from "@/components/CoordinatorSidebar";
import { getExpenseById, getMemorandumDownloadUrl, getCostBreakdownReceiptDownloadUrl, mergeTravelDates, type Expense } from "@/services/expenses";
import ThemeToggle from "@/components/ThemeToggle";

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
            <p className="text-sm text-orange-600">Esta solicitação está aguardando decisão de aprovação</p>
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
            <p className="text-sm text-green-600">Solicitação aprovada e aguardando processamento administrativo</p>
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
            <p className="text-sm text-blue-600">Discriminação de custos em andamento pelo setor administrativo</p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs font-semibold text-blue-500">Enviado em</p>
          <p className="text-sm font-bold text-blue-800">{date}</p>
        </div>
      </div>
    );
  }

  if (expense.status === "CONCLUIDO") {
    return (
      <div className="flex items-center justify-between rounded-xl border-l-4 border-violet-500 bg-violet-50 px-6 py-4 mb-5">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-500">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="h-5 w-5">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-violet-700">Solicitação Concluída</p>
            <p className="text-sm text-violet-600">Fluxo encerrado — todos os documentos foram processados</p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs font-semibold text-violet-500">Enviado em</p>
          <p className="text-sm font-bold text-violet-800">{date}</p>
        </div>
      </div>
    );
  }

  if (expense.status === "EM_EDICAO") {
    return (
      <div className="flex items-start justify-between rounded-xl border-l-4 border-amber-400 bg-amber-50 px-6 py-4 mb-5">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-400 mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="h-5 w-5">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-amber-700">Aguardando Correção do Aluno</p>
            {expense.correctionReason ? (
              <p className="text-sm text-amber-600 mt-0.5 max-w-prose">
                <span className="font-semibold">Instrução: </span>{expense.correctionReason}
              </p>
            ) : (
              <p className="text-sm text-amber-600">Correção solicitada. Aguardando o aluno editar a solicitação.</p>
            )}
          </div>
        </div>
        <div className="text-right hidden sm:block shrink-0 ml-4">
          <p className="text-xs font-semibold text-amber-500">Enviado em</p>
          <p className="text-sm font-bold text-amber-800">{date}</p>
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
            <p className="text-sm text-red-600">Esta solicitação foi rejeitada</p>
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

export default function CoordinatorExpenseDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [expense, setExpense] = useState<Expense | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [baixandoMemorandum, setBaixandoMemorandum] = useState(false);
  const [baixandoComprovante, setBaixandoComprovante] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    if (!id || typeof id !== "string") return;
    carregarDados(token, id);
  }, [router, id]);

  async function carregarDados(token: string, expId: string) {
    setCarregando(true);
    const result = await getExpenseById(token, expId);
    if (result.ok) {
      setExpense(mergeTravelDates(result.data));
    } else if (result.error === "UNAUTHORIZED") {
      useAuthStore.getState().clearToken();
      localStorage.removeItem("accessToken");
      router.push("/login");
    } else if (result.error === "NOT_FOUND") {
      setErro("Solicitação não encontrada.");
    } else {
      setErro("Erro ao carregar solicitação.");
    }
    setCarregando(false);
  }

  async function handleDownloadMemorandum() {
    const token = getToken();
    if (!token || !expense) return;
    setBaixandoMemorandum(true);
    const result = await getMemorandumDownloadUrl(token, expense.id);
    setBaixandoMemorandum(false);
    if (result.ok) window.open(result.downloadUrl, "_blank");
  }

  async function handleBaixarComprovante(breakdownId: string) {
    const token = getToken();
    if (!token || !expense) return;
    setBaixandoComprovante(breakdownId);
    const result = await getCostBreakdownReceiptDownloadUrl(token, expense.id, breakdownId);
    setBaixandoComprovante(null);
    if (result.ok) window.open(result.url, "_blank");
  }

  if (carregando) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <svg className="animate-spin h-8 w-8 text-[#1a5c38]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Carregando solicitação...</p>
        </div>
      </div>
    );
  }

  if (erro && !expense) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <p className="text-red-600 font-medium">{erro}</p>
          <button
            onClick={() => router.push("/dashboard/coordinator")}
            className="mt-4 text-sm text-[#1a5c38] hover:underline"
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
  const student = expense.student;
  const profile = student?.profile;
  const hasBankingInfo = profile?.bankCode || profile?.bankName || profile?.bankAgency || profile?.bankAccount;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <CoordinatorSidebar active={null} userName={null} onLogout={() => router.push("/login")} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex flex-col gap-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard/coordinator")}
              className="rounded-lg p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
              </svg>
            </button>
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-gray-50 sm:text-xl">Detalhe da Solicitação</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                {displayId} • {expense.title}
              </p>
            </div>
          </div>
          <ThemeToggle />
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6">
          <StatusBanner expense={expense} />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Left column */}
            <div className="col-span-1 space-y-5 lg:col-span-2">

              {/* Expense Overview */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-blue-500">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">Dados da Solicitação</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Título</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{expense.title}</p>
                  </div>
                  {expense.description && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Descrição</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{expense.description}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Evento</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{expense.event?.name ?? "—"}</p>
                    {expense.event?.location && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{expense.event.location}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Nível do trabalho (QUALIS)</p>
                    <span className="inline-flex items-center rounded-md bg-indigo-100 dark:bg-indigo-900/30 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                      {expense.article?.classification ?? "—"}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Destino</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {expense.event?.location ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Data de ida</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {expense.departureDate ? new Date(expense.departureDate).toLocaleDateString("pt-BR") : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Data de volta</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {expense.returnDate ? new Date(expense.returnDate).toLocaleDateString("pt-BR") : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Enviado em</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{fmtDate(expense.createdAt)}</p>
                  </div>
                  {expense.project && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Projeto</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                        <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/20 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-700 mr-1">
                          {expense.project.code}
                        </span>
                        {expense.project.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Cost Breakdown — read-only view */}
              {(expense.costBreakdowns ?? []).length > 0 && (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-blue-500">
                      <path fillRule="evenodd" d="M1 4a1 1 0 011-1h16a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4zm12 4a3 3 0 11-6 0 3 3 0 016 0zM4 9a1 1 0 100-2 1 1 0 000 2zm13-1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                    </svg>
                    <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">Discriminação de Custos</h2>
                    <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                      {expense.costBreakdowns!.length} {expense.costBreakdowns!.length !== 1 ? "itens" : "item"}
                    </span>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <th className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider pb-2">Tipo de Custo</th>
                        <th className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider pb-2">Projeto</th>
                        <th className="text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider pb-2">Valor</th>
                        <th className="text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider pb-2">Comprovante</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {expense.costBreakdowns!.map((cb) => (
                        <tr key={cb.id}>
                          <td className="py-2.5 font-medium text-gray-700 dark:text-gray-300">{cb.subcategory.name}</td>
                          <td className="py-2.5">
                            {cb.project ? (
                              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
                                {cb.project.code}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                            )}
                          </td>
                          <td className="py-2.5 text-right font-semibold text-gray-900 dark:text-gray-50">{fmtCurrency(cb.amount)}</td>
                          <td className="py-2.5 text-right">
                            {cb.attachmentKey ? (
                              <button
                                onClick={() => handleBaixarComprovante(cb.id)}
                                disabled={baixandoComprovante === cb.id}
                                className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 transition"
                              >
                                {baixandoComprovante === cb.id ? (
                                  <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                  </svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                                    <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                                    <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                                  </svg>
                                )}
                                Baixar
                              </button>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-200 dark:border-gray-700">
                        <td className="pt-3 text-sm font-bold text-gray-700 dark:text-gray-300">Total</td>
                        <td />
                        <td className="pt-3 text-right text-sm font-bold text-gray-900 dark:text-gray-50">{fmtCurrency(totalCusto)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

            </div>

            {/* Right column */}
            <div className="col-span-1 space-y-5">

              {/* Solicitante */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-gray-400 dark:text-gray-500">
                    <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                  </svg>
                  <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">Solicitante</h2>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Nome</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{student?.name ?? "—"}</p>
                  </div>
                  {student?.email && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">E-mail</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{student.email}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Dados bancários — D1 */}
              {hasBankingInfo ? (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-gray-400 dark:text-gray-500">
                      <path fillRule="evenodd" d="M1 4a1 1 0 011-1h16a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4zm12 4a3 3 0 11-6 0 3 3 0 016 0zM4 9a1 1 0 100-2 1 1 0 000 2zm13-1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                    </svg>
                    <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">Dados Bancários</h2>
                  </div>
                  <div className="space-y-3">
                    {profile?.bankCode && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Código do banco</p>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{profile.bankCode}</p>
                      </div>
                    )}
                    {profile?.bankName && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Nome do banco</p>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{profile.bankName}</p>
                      </div>
                    )}
                    {profile?.bankAgency && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Agência</p>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{profile.bankAgency}</p>
                      </div>
                    )}
                    {profile?.bankAccount && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Conta</p>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{profile.bankAccount}</p>
                      </div>
                    )}
                    {profile?.pixKey && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Chave PIX</p>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{profile.pixKey}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-gray-300 dark:text-gray-600">
                      <path fillRule="evenodd" d="M1 4a1 1 0 011-1h16a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4zm12 4a3 3 0 11-6 0 3 3 0 016 0zM4 9a1 1 0 100-2 1 1 0 000 2zm13-1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                    </svg>
                    <h2 className="text-sm font-semibold text-gray-400 dark:text-gray-500">Dados Bancários</h2>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Não disponíveis — o aluno deve preencher os dados bancários no perfil.
                  </p>
                </div>
              )}

              {/* Trabalho publicado */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-gray-400 dark:text-gray-500">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">Trabalho publicado</h2>
                </div>
                {expense.attachmentKey ? (
                  <button
                    onClick={handleDownloadMemorandum}
                    disabled={baixandoMemorandum}
                    className="flex w-full items-center gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 transition"
                  >
                    {baixandoMemorandum ? (
                      <svg className="animate-spin h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
                        <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                        <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                      </svg>
                    )}
                    <span className="flex-1 text-left truncate">
                      {baixandoMemorandum ? "Baixando..." : expense.attachmentKey.split("/").pop()}
                    </span>
                  </button>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500">Nenhum arquivo anexado.</p>
                )}
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
