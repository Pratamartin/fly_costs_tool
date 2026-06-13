import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuthStore } from "@/store/authStore";
import { getToken } from "@/lib/getToken";
import AdminSidebar from "@/components/AdminSidebar";
import ModalCriarProjeto, { NovoDadosProjeto } from "@/components/ModalCriarProjeto";
import { getAdminDashboard, getTopProjects, type AdminDashboard, type TopProject } from "@/services/analytics";
import { listExpenses, type Expense, type ExpenseStatus } from "@/services/expenses";
import { createProject } from "@/services/projects";
import NotificationsPanel from "@/components/NotificationsPanel";
import { toast } from "@/lib/toast";
import ThemeToggle from "@/components/ThemeToggle";

const AVATAR_COLORS: Record<string, string> = {
  A: "bg-pink-500", B: "bg-indigo-500", C: "bg-sky-500", D: "bg-violet-500",
  E: "bg-emerald-500", F: "bg-rose-500", M: "bg-amber-500", S: "bg-indigo-500",
};

function Avatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${AVATAR_COLORS[initial] ?? "bg-gray-500"} text-xs font-bold text-white`}>
      {initial}
    </div>
  );
}

function StatusBadge({ status }: { status: ExpenseStatus }) {
  const config: Record<ExpenseStatus, { bg: string; ring: string; text: string; label: string }> = {
    PENDENTE:         { bg: "bg-yellow-50", ring: "ring-yellow-200", text: "text-yellow-700", label: "Pendente" },
    APROVADO:         { bg: "bg-green-50",  ring: "ring-green-200",  text: "text-green-700",  label: "Aprovado" },
    REJEITADO:        { bg: "bg-red-50",    ring: "ring-red-200",    text: "text-red-700",    label: "Rejeitado" },
    EM_PROCESSAMENTO: { bg: "bg-blue-50",   ring: "ring-blue-200",   text: "text-blue-700",   label: "Em Proc." },
    EM_EDICAO:        { bg: "bg-amber-50",  ring: "ring-amber-200",  text: "text-amber-700",  label: "Em Edição" },
    CONCLUIDO:        { bg: "bg-violet-50", ring: "ring-violet-200", text: "text-violet-700", label: "Concluído" },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center rounded-full ${c.bg} px-2.5 py-1 text-xs font-semibold ${c.text} ring-1 ring-inset ${c.ring}`}>
      {c.label}
    </span>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmt(v: string | number) {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

export default function DashboardAdmin() {
  const router = useRouter();
  const [showModalCriar, setShowModalCriar] = useState(false);
  const [criando, setCriando] = useState(false);
  const [erroCriar, setErroCriar] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [topProjects, setTopProjects] = useState<TopProject[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    carregarDados(token);
  }, [router]);

  async function carregarDados(token: string) {
    setCarregando(true);
    const [dashResult, topResult, expResult] = await Promise.all([
      getAdminDashboard(token),
      getTopProjects(token, 5),
      listExpenses(token),
    ]);
    if (dashResult.ok) setDashboard(dashResult.data);
    if (topResult.ok) setTopProjects(topResult.data);
    if (expResult.ok) setRecentExpenses(expResult.data.slice(0, 5));
    if (
      (!dashResult.ok && dashResult.error === "UNAUTHORIZED") ||
      (!expResult.ok && expResult.error === "UNAUTHORIZED")
    ) {
      useAuthStore.getState().clearToken();
      localStorage.removeItem("accessToken");
      router.push("/login");
    }
    setCarregando(false);
  }

  async function handleCriarProjeto(data: NovoDadosProjeto) {
    const token = getToken();
    if (!token) return;
    setCriando(true);
    setErroCriar(null);
    const result = await createProject(token, {
      name: data.name,
      code: data.code,
      budget: data.budget,
      subcategories: data.topics,
    });
    setCriando(false);
    if (result.ok) {
      setShowModalCriar(false);
      toast.success("Projeto criado com sucesso!");
    } else if (result.error === "CONFLICT") {
      setErroCriar("Já existe um projeto com esse código.");
    } else {
      setErroCriar("Erro ao criar projeto. Tente novamente.");
    }
  }

  const totalValue = dashboard ? parseFloat(dashboard.totalValue) : 0;
  const budgetCommitted = dashboard ? parseFloat(dashboard.budgetCommitted) : 0;
  const pendingCount = dashboard?.byStatus.PENDENTE ?? 0;
  const totalRequests = dashboard?.totalRequests ?? 0;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <AdminSidebar active="dashboard" />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex flex-col gap-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-4">
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-gray-50 sm:text-xl">Painel Global</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">Visão geral de todos os projetos e despesas acadêmicas</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex-1 sm:flex-none">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400 dark:text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                </svg>
              </span>
              <input type="text" placeholder="Pesquisar projetos, despesas..." className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 py-2 pl-9 pr-4 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-[#1e2d3d] focus:ring-1 focus:ring-[#1e2d3d] sm:w-56" />
            </div>
            <ThemeToggle />
            <NotificationsPanel role="admin" />
            <button
              onClick={() => { setErroCriar(null); setShowModalCriar(true); }}
              className="flex items-center gap-2 rounded-lg bg-[#2563EB] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1d4ed8] transition sm:px-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
              <span className="hidden sm:inline">Criar Projeto</span>
              <span className="sm:hidden">Criar</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6">

          {/* Stats cards */}
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-4 shadow-sm sm:px-6 sm:py-5">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total de Gastos</p>
                <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-50 sm:text-2xl">
                  {carregando ? "—" : `R$ ${fmt(totalValue)}`}
                </p>
                <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">valor total das despesas</p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-blue-600">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-1a.75.75 0 000 1.5h1v.75a.75.75 0 001.5 0v-.75h1a.75.75 0 000-1.5h-1v-2.5z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-4 shadow-sm sm:px-6 sm:py-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Orçamento Comprometido</p>
                  <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-50 sm:text-2xl">
                    {carregando ? "—" : `R$ ${fmt(budgetCommitted)}`}
                  </p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-green-600">
                    <path fillRule="evenodd" d="M1 2.75A.75.75 0 011.75 2h16.5a.75.75 0 010 1.5H18v8.75A2.75 2.75 0 0115.25 15h-1.072l.798 3.06a.75.75 0 01-1.452.38L13.41 18H6.59l-.114.44a.75.75 0 01-1.452-.38L5.823 15H4.75A2.75 2.75 0 012 12.25V3.5h-.25A.75.75 0 011 2.75z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">em projetos em processamento</p>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-4 shadow-sm sm:px-6 sm:py-5">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Solicitações Pendentes</p>
                <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-50 sm:text-2xl">
                  {carregando ? "—" : pendingCount}
                </p>
                <p className="mt-1.5 text-xs text-orange-500">
                  {totalRequests > 0 ? `${totalRequests} solicitações no total` : "Nenhuma solicitação"}
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-orange-500">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* Status breakdown + Top projects */}
          {!carregando && dashboard && (
            <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Status breakdown */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-5 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold text-gray-800 dark:text-gray-100">Despesas por Status</h2>
                <div className="space-y-3">
                  {([
                    { key: "PENDENTE",         label: "Pendente",          color: "bg-yellow-400" },
                    { key: "APROVADO",         label: "Aprovado",          color: "bg-green-400" },
                    { key: "REJEITADO",        label: "Rejeitado",         color: "bg-red-400" },
                    { key: "EM_PROCESSAMENTO", label: "Em Processamento",  color: "bg-blue-400" },
                  ] as { key: keyof typeof dashboard.byStatus; label: string; color: string }[]).map(({ key, label, color }) => {
                    const count = dashboard.byStatus[key];
                    const pct = totalRequests > 0 ? Math.round((count / totalRequests) * 100) : 0;
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">{count} <span className="text-xs text-gray-400 dark:text-gray-500">({pct}%)</span></span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                          <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top projects */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-5 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold text-gray-800 dark:text-gray-100">Top Projetos por Solicitações</h2>
                {topProjects.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500">Nenhum projeto com solicitações.</p>
                ) : (
                  <div className="space-y-3">
                    {topProjects.map((p, i) => (
                      <div key={p.id} className="flex items-center gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">{p.name}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{p.totalRequests} solicitações · R$ {fmt(p.totalValue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Atividade Recente</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500">Últimas despesas registradas</p>
              </div>
              <button
                onClick={() => router.push("/dashboard/admin/expenses")}
                className="text-xs font-medium text-[#2563EB] hover:underline"
              >
                Ver todas →
              </button>
            </div>

            {carregando ? (
              <div className="py-12 text-center">
                <svg className="mx-auto animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : (
              <>
                <table className="hidden w-full md:table">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">ID Despesa</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Solicitação</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Aluno</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Data</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {recentExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">Nenhuma despesa registrada.</td>
                      </tr>
                    ) : recentExpenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <td className="px-6 py-4">
                          <button onClick={() => router.push({ pathname: "/dashboard/admin/expenses/detail", query: { id: expense.id } })} className="text-sm font-semibold text-[#2563EB] hover:underline">
                            REQ-{expense.id.slice(0, 8).toUpperCase()}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-700 dark:text-gray-300">{expense.title}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{expense.project?.name ?? "Sem projeto"}</p>
                        </td>
                        <td className="px-6 py-4">
                          {expense.student ? (
                            <div className="flex items-center gap-2">
                              <Avatar name={expense.student.name} />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{expense.student.name}</span>
                            </div>
                          ) : <span className="text-sm text-gray-400 dark:text-gray-500">—</span>}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{formatDate(expense.createdAt)}</td>
                        <td className="px-6 py-4"><StatusBadge status={expense.status} /></td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end">
                            <button onClick={() => router.push({ pathname: "/dashboard/admin/expenses/detail", query: { id: expense.id } })} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600 transition">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41z" clipRule="evenodd" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-t border-gray-100 dark:border-gray-800 px-6 py-4">
                  <p className="text-sm text-gray-400 dark:text-gray-500">Exibindo {recentExpenses.length} despesas mais recentes</p>
                </div>

                {/* Cards — mobile */}
                <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                  {recentExpenses.map((expense) => (
                    <div key={expense.id} className="px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <button onClick={() => router.push({ pathname: "/dashboard/admin/expenses/detail", query: { id: expense.id } })} className="text-sm font-semibold text-[#2563EB] hover:underline">
                          REQ-{expense.id.slice(0, 8).toUpperCase()}
                        </button>
                        <StatusBadge status={expense.status} />
                      </div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-1">{expense.title}</p>
                      <div className="flex items-center justify-between">
                        {expense.student && (
                          <div className="flex items-center gap-2">
                            <Avatar name={expense.student.name} />
                            <span className="text-xs text-gray-600 dark:text-gray-400">{expense.student.name}</span>
                          </div>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(expense.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {showModalCriar && (
        <ModalCriarProjeto
          onClose={() => setShowModalCriar(false)}
          onConfirm={handleCriarProjeto}
          carregando={criando}
          erro={erroCriar}
        />
      )}
    </div>
  );
}
