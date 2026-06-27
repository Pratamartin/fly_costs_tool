import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuthStore } from "@/store/authStore";
import { getToken } from "@/lib/getToken";
import { performLogout } from "@/lib/logout";
import StudentSidebar from "@/components/StudentSidebar";
import { getMe, type UserProfile } from "@/services/user";
import {
  getExpenseById,
  getMemorandumDownloadUrl,
  getCostBreakdownReceiptDownloadUrl,
  type Expense,
} from "@/services/expenses";
import ThemeToggle from "@/components/ThemeToggle";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function StudentExpenseDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [expense, setExpense] = useState<Expense | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [baixandoMemorandum, setBaixandoMemorandum] = useState(false);
  const [baixandoComprovante, setBaixandoComprovante] = useState<string | null>(null);

  useEffect(() => {
    if (!id || typeof id !== "string") return;

    const token = getToken();
    if (!token) { router.push("/login"); return; }

    async function carregar() {
      const token = getToken();
      const [meResult, expResult] = await Promise.all([
        getMe(token),
        getExpenseById(token, id as string),
      ]);

      if (!meResult.ok) {
        if (meResult.error === "UNAUTHORIZED") {
          useAuthStore.getState().clearToken();
          localStorage.removeItem("accessToken");
          router.push("/login");
          return;
        }
        setErro("Erro ao carregar perfil.");
        setCarregando(false);
        return;
      }
      setUserProfile(meResult.data);

      if (!expResult.ok) {
        if (expResult.error === "UNAUTHORIZED") {
          useAuthStore.getState().clearToken();
          localStorage.removeItem("accessToken");
          router.push("/login");
          return;
        }
        setErro(expResult.error === "NOT_FOUND" ? "Despesa não encontrada." : "Erro ao carregar despesa.");
        setCarregando(false);
        return;
      }

      const allowedStatuses = ["PENDENTE", "CONCLUIDO", "REJEITADO", "APROVADO", "EM_PROCESSAMENTO"];
      if (!allowedStatuses.includes(expResult.data.status)) {
        router.replace("/dashboard/student");
        return;
      }

      setExpense(expResult.data);
      setCarregando(false);
    }

    carregar();
  }, [router, id]);

  async function handleDownloadMemorandum() {
    const token = getToken();
    if (!token || !expense) return;
    setBaixandoMemorandum(true);
    const result = await getMemorandumDownloadUrl(token, expense.id);
    setBaixandoMemorandum(false);
    if (result.ok) window.open(result.downloadUrl, "_blank");
  }

  async function handleDownloadComprovante(breakdownId: string) {
    const token = getToken();
    if (!token || !expense) return;
    setBaixandoComprovante(breakdownId);
    const result = await getCostBreakdownReceiptDownloadUrl(token, expense.id, breakdownId);
    setBaixandoComprovante(null);
    if (result.ok) window.open(result.url, "_blank");
  }

  async function handleLogout() {
    await performLogout(router);
  }

  if (carregando) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <svg className="animate-spin h-8 w-8 text-[#4F46E5]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (erro || !expense) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <p className="text-red-600 font-medium">{erro ?? "Erro inesperado."}</p>
          <button onClick={() => router.push("/dashboard/student")} className="mt-4 text-sm text-[#4F46E5] hover:underline">
            Voltar para minhas solicitações
          </button>
        </div>
      </div>
    );
  }

  const displayId = `REQ-${expense.id.slice(0, 8).toUpperCase()}`;
  const breakdowns = expense.costBreakdowns ?? [];
  const total = breakdowns.reduce((sum, cb) => sum + cb.amount, 0);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <StudentSidebar userName={userProfile?.name ?? null} onLogout={handleLogout} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 sm:px-8 sm:py-4">
          <button
            onClick={() => router.push("/dashboard/student")}
            className="rounded-lg p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-gray-900 dark:text-gray-50 sm:text-xl">Detalhes da Solicitação</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{displayId} • {expense.title}</p>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6">

          {/* Status banner */}
          {expense.status === "PENDENTE" && (
            <div className="flex items-center justify-between rounded-xl border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-600 px-6 py-4 mb-5">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-500">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="h-5 w-5">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-amber-700 dark:text-amber-400">Aguardando Análise</p>
                  <p className="text-sm text-amber-600 dark:text-amber-500">Sua solicitação está em fila e será analisada pelo coordenador em breve.</p>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-amber-500">Criado em</p>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">{fmtDate(expense.createdAt)}</p>
              </div>
            </div>
          )}

          {expense.status === "CONCLUIDO" && (
            <div className="flex items-center justify-between rounded-xl border-l-4 border-violet-500 bg-violet-50 dark:bg-violet-950/30 dark:border-violet-600 px-6 py-4 mb-5">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-500">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="h-5 w-5">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-violet-700 dark:text-violet-400">Solicitação Concluída</p>
                  <p className="text-sm text-violet-600 dark:text-violet-500">Todos os documentos foram processados pelo administrador.</p>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-violet-500">Criado em</p>
                <p className="text-sm font-bold text-violet-800 dark:text-violet-300">{fmtDate(expense.createdAt)}</p>
              </div>
            </div>
          )}

          {expense.status === "REJEITADO" && (
            <div className="rounded-xl border-l-4 border-red-500 bg-red-50 dark:bg-red-950/30 dark:border-red-600 px-6 py-4 mb-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-500">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="h-5 w-5">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-red-700 dark:text-red-400">Solicitação Reprovada</p>
                  <p className="text-sm text-red-600 dark:text-red-500">Esta solicitação foi reprovada pelo coordenador.</p>
                  {expense.rejectionReason && (
                    <div className="mt-2 rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-gray-900 px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-red-400 dark:text-red-500 mb-0.5">Motivo</p>
                      <p className="text-sm text-red-800 dark:text-red-300">{expense.rejectionReason}</p>
                    </div>
                  )}
                </div>
                <div className="text-right hidden sm:block shrink-0">
                  <p className="text-xs font-semibold text-red-400">Criado em</p>
                  <p className="text-sm font-bold text-red-700 dark:text-red-300">{fmtDate(expense.createdAt)}</p>
                </div>
              </div>
            </div>
          )}

          {expense.status === "APROVADO" && (
            <div className="flex items-center justify-between rounded-xl border-l-4 border-green-500 bg-green-50 dark:bg-green-950/30 dark:border-green-600 px-6 py-4 mb-5">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-500">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="h-5 w-5">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-green-700 dark:text-green-400">Aprovado pelo Coordenador</p>
                  <p className="text-sm text-green-600 dark:text-green-500">Sua solicitação foi aprovada e está aguardando processamento pelo administrador.</p>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-green-500">Criado em</p>
                <p className="text-sm font-bold text-green-800 dark:text-green-300">{fmtDate(expense.createdAt)}</p>
              </div>
            </div>
          )}

          {expense.status === "EM_PROCESSAMENTO" && (
            <div className="flex items-center justify-between rounded-xl border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-600 px-6 py-4 mb-5">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-500">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="h-5 w-5">
                    <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-blue-700 dark:text-blue-400">Em Processamento</p>
                  <p className="text-sm text-blue-600 dark:text-blue-500">O administrador está processando os documentos da sua solicitação.</p>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-blue-500">Criado em</p>
                <p className="text-sm font-bold text-blue-800 dark:text-blue-300">{fmtDate(expense.createdAt)}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Left column */}
            <div className="col-span-1 space-y-5 lg:col-span-2">

              {/* Visão Geral */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
                <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-5">Visão Geral</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">ID</p>
                    <p className="text-sm font-bold text-[#4F46E5]">{displayId}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Título</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{expense.title}</p>
                  </div>
                  {expense.description && (
                    <div className="col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Descrição</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{expense.description}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Evento</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{expense.event?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Local</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{expense.event?.location}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">QUALIS</p>
                    <span className="inline-flex items-center rounded-md bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                      {expense.article?.classification}
                    </span>
                  </div>
                  {expense.project && (
                    <div className="col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Projeto</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                        {expense.project.name}{" "}
                        <span className="font-mono text-xs text-gray-400 dark:text-gray-500">({expense.project.code})</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Portfólio de Arquivos */}
              <div className="rounded-xl border border-violet-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-violet-500">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">Portfólio de Arquivos</h2>
                </div>

                <div className="space-y-3">
                  {/* Memorando */}
                  {expense.attachmentKey && (
                    <div className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-indigo-600">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-50">Trabalho publicado</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{expense.attachmentKey.split("/").pop()}</p>
                        </div>
                      </div>
                      <button
                        onClick={handleDownloadMemorandum}
                        disabled={baixandoMemorandum}
                        className="ml-3 flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
                      >
                        {baixandoMemorandum ? (
                          <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                            <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                            <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                          </svg>
                        )}
                        Baixar
                      </button>
                    </div>
                  )}

                  {/* Cost breakdowns */}
                  {breakdowns.map((cb) => (
                    <div key={cb.id} className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-blue-600">
                            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{cb.subcategory.name}</p>
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{fmtCurrency(cb.amount)}</p>
                        </div>
                      </div>
                      {cb.attachmentKey ? (
                        <button
                          onClick={() => handleDownloadComprovante(cb.id)}
                          disabled={baixandoComprovante === cb.id}
                          className="ml-3 flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
                        >
                          {baixandoComprovante === cb.id ? (
                            <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                              <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                              <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                            </svg>
                          )}
                          Baixar
                        </button>
                      ) : (
                        <span className="ml-3 text-xs text-gray-300 dark:text-gray-600 shrink-0">—</span>
                      )}
                    </div>
                  ))}

                  {breakdowns.length === 0 && !expense.attachmentKey && (
                    <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Nenhum arquivo disponível.</p>
                  )}

                  {/* Total */}
                  {total > 0 && (
                    <div className="flex items-center justify-between rounded-lg border border-violet-200 bg-violet-50 px-4 py-3">
                      <p className="text-sm font-bold text-violet-700">Total</p>
                      <p className="text-lg font-bold text-violet-800">{fmtCurrency(total)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <div className="space-y-5">
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-4">Detalhes do Evento</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Evento</p>
                    <p className="mt-0.5 text-sm font-semibold text-gray-800 dark:text-gray-100">{expense.event?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Local</p>
                    <p className="mt-0.5 text-sm font-semibold text-gray-800 dark:text-gray-100">{expense.event?.location}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">QUALIS</p>
                    <span className="mt-0.5 inline-flex items-center rounded-md bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                      {expense.article?.classification}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Criado em</p>
                    <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{fmtDate(expense.createdAt)}</p>
                  </div>
                </div>
              </div>

              {expense.project && (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-4">Projeto Vinculado</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Nome</p>
                      <p className="mt-0.5 text-sm font-semibold text-gray-800 dark:text-gray-100">{expense.project.name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Código</p>
                      <span className="mt-0.5 inline-flex items-center rounded-md bg-gray-100 dark:bg-gray-700 px-2.5 py-1 text-xs font-mono font-semibold text-gray-700 dark:text-gray-300">
                        {expense.project.code}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
