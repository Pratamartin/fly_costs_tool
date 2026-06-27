import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuthStore } from "@/store/authStore";
import { getToken } from "@/lib/getToken";
import AdminSidebar from "@/components/AdminSidebar";
import { getProjectById, updateProject, type Project, type UpdateProjectPayload } from "@/services/projects";
import { listCategories, type ExpenseCategory } from "@/services/categories";
import { listExpenses, type Expense, type ExpenseStatus } from "@/services/expenses";
import ThemeToggle from "@/components/ThemeToggle";

type TabType = "overview" | "expenses" | "team";

const STATUS_LABELS: Record<ExpenseStatus, string> = {
  PENDENTE: "Pendente",
  APROVADO: "Aprovado",
  REJEITADO: "Rejeitado",
  EM_PROCESSAMENTO: "Em Processamento",
  EM_EDICAO: "Em Edição",
  CONCLUIDO: "Concluído",
};

const STATUS_STYLES: Record<ExpenseStatus, string> = {
  PENDENTE: "bg-yellow-50 text-yellow-700 ring-yellow-200",
  APROVADO: "bg-green-50 text-green-700 ring-green-200",
  REJEITADO: "bg-red-50 text-red-700 ring-red-200",
  EM_PROCESSAMENTO: "bg-blue-50 text-blue-700 ring-blue-200",
  EM_EDICAO: "bg-orange-50 text-orange-700 ring-orange-200",
  CONCLUIDO: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

function StatusBadge({ status }: { status: ExpenseStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function StudentAvatar({ name }: { name: string }) {
  const initial = name.trim()[0]?.toUpperCase() ?? "?";
  const palette = ["bg-sky-500", "bg-pink-500", "bg-violet-500", "bg-amber-500", "bg-indigo-500", "bg-emerald-500", "bg-rose-500"];
  const color = palette[name.charCodeAt(0) % palette.length];
  return (
    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${color} text-xs font-bold text-white`}>
      {initial}
    </div>
  );
}


export default function DashboardAdminProjectDetalhe() {
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState<TabType>("overview");
  const [project, setProject] = useState<Project | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregar, setErroCarregar] = useState<string | null>(null);

  const [projectExpenses, setProjectExpenses] = useState<Expense[]>([]);

  // edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editTopics, setEditTopics] = useState<string[]>([]);
  const [showTopicPicker, setShowTopicPicker] = useState(false);
  const [categoriasApi, setCategoriasApi] = useState<ExpenseCategory[]>([]);
  const [carregandoCat, setCarregandoCat] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroEdit, setErroEdit] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const id = router.query.id as string | undefined;
    if (!id) return;

    setCarregando(true);
    getProjectById(token, id).then((result) => {
      if (result.ok) {
        setProject(result.data);
        listExpenses(token, undefined, id).then((expResult) => {
          if (expResult.ok) setProjectExpenses(expResult.data);
        });
      } else if (result.error === "UNAUTHORIZED") {
        useAuthStore.getState().clearToken();
        localStorage.removeItem("accessToken");
        router.push("/login");
      } else if (result.error === "NOT_FOUND") {
        setErroCarregar("Projeto não encontrado.");
      } else {
        setErroCarregar("Erro ao carregar o projeto.");
      }
      setCarregando(false);
    });
  }, [router, router.query.id]);

  function openEditModal() {
    if (!project) return;
    setEditName(project.name);
    setEditCode(project.code);
    setEditTopics([...project.subcategories]);
    setErroEdit(null);
    setShowEdit(true);

    if (categoriasApi.length === 0) {
      setCarregandoCat(true);
      const token = getToken() || undefined;
      listCategories(undefined, token).then((r) => {
        if (r.ok) setCategoriasApi(r.data);
        setCarregandoCat(false);
      });
    }
  }

  async function handleSalvarEdicao() {
    if (!project) return;
    const token = getToken();
    if (!token) return;
    setSalvando(true);
    setErroEdit(null);
    const payload: UpdateProjectPayload = {};
    if (editName.trim() !== project.name) payload.name = editName.trim();
    if (editCode.trim().toUpperCase() !== project.code) payload.code = editCode.trim().toUpperCase();
    const subcatsChanged = JSON.stringify([...editTopics].sort()) !== JSON.stringify([...project.subcategories].sort());
    if (subcatsChanged) payload.subcategories = editTopics;

    if (Object.keys(payload).length === 0) { setShowEdit(false); setSalvando(false); return; }

    const result = await updateProject(token, project.id, payload);
    setSalvando(false);
    if (result.ok) {
      setProject(result.data);
      setShowEdit(false);
    } else if (result.error === "CONFLICT") {
      setErroEdit("Já existe um projeto com esse código.");
    } else if (result.error === "BAD_REQUEST") {
      setErroEdit("Dados inválidos. Verifique os campos.");
    } else {
      setErroEdit("Erro ao salvar. Tente novamente.");
    }
  }

  const availableTopicsToAdd = categoriasApi
    .filter((c) => !editTopics.includes(c.normalizedName))
    .map((c) => c.name);
  // helper: resolve display name from normalizedName or return as-is
  const resolveTopicName = (key: string) =>
    categoriasApi.find((c) => c.normalizedName === key)?.name ?? key;

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: "overview", label: "Visão Geral" },
    { id: "expenses", label: "Despesas" },
    { id: "team", label: "Membros da Equipe" },
  ];

  const budgetPct = project && project.budget > 0
    ? Math.min(100, Math.round((project.usedBudget / project.budget) * 100))
    : 0;

  const fmtBRL = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (carregando) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (erroCarregar || !project) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">{erroCarregar ?? "Projeto não encontrado."}</p>
          <button onClick={() => router.push("/dashboard/admin/projects")} className="text-sm text-blue-600 hover:underline">
            Voltar aos Projetos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <AdminSidebar active="projects" />

      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Editar Projeto</h2>
              <button onClick={() => setShowEdit(false)} disabled={salvando} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition disabled:opacity-50">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {erroEdit && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erroEdit}</p>
              )}

              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">Nome do Projeto <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={salvando}
                  className="w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm text-gray-800 outline-none focus:ring-1 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">Sigla do Projeto <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                  disabled={salvando}
                  className="w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm text-gray-800 uppercase outline-none focus:ring-1 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
                />
                <p className="mt-1 text-xs text-gray-400">O orçamento não pode ser alterado após a criação.</p>
              </div>

              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">Subcategorias</label>
                <div className="flex flex-wrap gap-2">
                  {editTopics.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">
                       {resolveTopicName(t)}
                      <button onClick={() => setEditTopics((prev) => prev.filter((x) => x !== t))} disabled={salvando} className="rounded-full p-0.5 hover:bg-white/20 transition disabled:opacity-50">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                        </svg>
                      </button>
                    </span>
                  ))}
                  {availableTopicsToAdd.length > 0 && (
                    <div className="relative">
                      <button
                        onClick={() => setShowTopicPicker((v) => !v)}
                        disabled={salvando || carregandoCat}
                        className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 transition disabled:opacity-50"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                          <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                        </svg>
                        {carregandoCat ? "Carregando..." : "Adicionar"}
                      </button>
                      {showTopicPicker && (
                        <div className="absolute left-0 top-full mt-1 z-10 w-52 rounded-xl border border-gray-200 bg-white shadow-xl py-1 max-h-48 overflow-y-auto">
                          {availableTopicsToAdd.map((t) => (
                            <button
                              key={t}
                                onClick={() => { const cat = categoriasApi.find((c) => c.name === t); setEditTopics((prev) => [...prev, cat?.normalizedName ?? t]); setShowTopicPicker(false); }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                              {t}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3">
              <button onClick={() => setShowEdit(false)} disabled={salvando} className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={handleSalvarEdicao} disabled={salvando} className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50">
                {salvando && (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {salvando ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="px-4 pt-3 pb-0 sm:px-8 sm:pt-4">
            <div className="mb-3 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <button onClick={() => router.push("/dashboard/admin/projects")} className="hover:text-gray-800 dark:hover:text-gray-200 hover:underline">
                Projetos
              </button>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
              <span className="font-medium text-gray-700 dark:text-gray-300">{project.name}</span>
            </div>
            <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => router.push("/dashboard/admin/projects")} className="flex items-center justify-center rounded-lg p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" /></svg>
                </button>
                <h1 className="text-base font-bold text-gray-900 dark:text-gray-50 sm:text-xl">{project.name}</h1>
                {project.isActive ? (
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-200">Ativo</span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 ring-1 ring-inset ring-gray-200">Arquivado</span>
                )}
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <ThemeToggle />
                <button
                  onClick={openEditModal}
                  className="hidden items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition sm:flex"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>
                  Editar Projeto
                </button>
              </div>
            </div>
            <nav className="flex gap-0 -mb-px">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setAbaAtiva(tab.id)}
                  className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${abaAtiva === tab.id ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-200"}`}>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6">
          {abaAtiva === "overview" && (
            <>
              <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
                {/* Orçamento Total */}
                <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-5 shadow-sm">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Orçamento Total</p>
                    <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-50 sm:text-2xl">{fmtBRL(project.budget)}</p>
                    <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-gray-400 dark:text-gray-500">
                      Sigla: <span className="font-mono font-semibold text-gray-600 dark:text-gray-400">{project.code}</span>
                    </span>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-blue-600"><path fillRule="evenodd" d="M1 2.75A.75.75 0 011.75 2h16.5a.75.75 0 010 1.5H18v8.75A2.75 2.75 0 0115.25 15h-1.072l.798 3.06a.75.75 0 01-1.452.38L13.41 18H6.59l-.114.44a.75.75 0 01-1.452-.38L5.823 15H4.75A2.75 2.75 0 012 12.25V3.5h-.25A.75.75 0 011 2.75z" clipRule="evenodd" /></svg>
                  </div>
                </div>
                {/* Orçamento Utilizado */}
                <div className="flex flex-col justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Orçamento Utilizado</p>
                      <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-50 sm:text-2xl">{fmtBRL(project.usedBudget)}</p>
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-purple-600"><path d="M10.75 10.818v2.614A3.13 3.13 0 0011.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 00-1.138-.432zM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 00-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.627-.514.909 0 .184.058.39.33.615z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-1a.75.75 0 000 1.5h1v.75a.75.75 0 001.5 0v-.75h1a.75.75 0 000-1.5h-1v-2.5z" clipRule="evenodd" /></svg>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="mb-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                      <div className={`h-2 rounded-full ${budgetPct >= 100 ? "bg-red-500" : budgetPct >= 85 ? "bg-amber-400" : "bg-purple-500"}`} style={{ width: `${budgetPct}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{budgetPct}% do orçamento utilizado</p>
                  </div>
                </div>
                {/* Saldo */}
                <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-5 shadow-sm">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Saldo</p>
                    <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-50 sm:text-2xl">
                      {fmtBRL(Math.max(0, project.budget - project.usedBudget))}
                    </p>
                    <p className={`mt-1.5 text-xs ${project.budget - project.usedBudget >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                      {project.budget - project.usedBudget >= 0 ? "disponível" : "excedido"}
                    </p>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-emerald-600">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>

                {/* Subcategorias */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Subcategorias</p>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-orange-500"><path fillRule="evenodd" d="M6 4.75A.75.75 0 016.75 4h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 4.75zM6 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 10zm0 5.25a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75a.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {project.subcategories.map((s) => (
                      <span key={s} className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
              {(project.resourceSource || project.startDate || project.endDate) && (
                <div className="mb-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-5 shadow-sm">
                  <h2 className="mb-4 text-sm font-semibold text-gray-800 dark:text-gray-100">Informações do Projeto</h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {project.resourceSource && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Fonte de recurso</p>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{project.resourceSource}</p>
                      </div>
                    )}
                    {project.startDate && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Data de início</p>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                          {new Date(project.startDate).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    )}
                    {project.endDate && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Data de fim</p>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                          {new Date(project.endDate).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* TODO backend: GET /v1/projects/:id ou endpoint dedicado de analytics precisa retornar
                  breakdown por categoria (Inscrição, Passagens, Diárias) com campos total, gasto, restante
                  para popular esta tabela com dados reais. Por ora exibe dados do orçamento geral. */}
              <div className="mb-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-5 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold text-gray-800 dark:text-gray-100">Discriminação por Categoria</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Categoria</th>
                      <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Total</th>
                      <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Gasto</th>
                      <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Restante</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {project.subcategories.map((cat) => {
                      const total = project.budget;
                      const gasto = project.usedBudget;
                      const restante = Math.max(0, total - gasto);
                      return (
                        <tr key={cat}>
                          <td className="py-3 font-medium text-gray-700 dark:text-gray-300 capitalize">{cat}</td>
                          <td className="py-3 text-right text-gray-900 dark:text-gray-50">{fmtBRL(total)}</td>
                          <td className="py-3 text-right text-gray-900 dark:text-gray-50">{fmtBRL(gasto)}</td>
                          <td className={`py-3 text-right font-semibold ${restante > 0 ? "text-emerald-600" : "text-red-500"}`}>{fmtBRL(restante)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {project.subcategories.length === 0 && (
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Nenhuma subcategoria cadastrada neste projeto.</p>
                )}
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4">
                  <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Despesas Vinculadas</h2>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{projectExpenses.length} despesa{projectExpenses.length !== 1 ? "s" : ""}</span>
                </div>
                {projectExpenses.length === 0 ? (
                  <div className="px-6 py-10 text-center">
                    <p className="text-sm text-gray-400 dark:text-gray-500">Nenhuma despesa vinculada a este projeto.</p>
                  </div>
                ) : (
                  <>
                    {/* Desktop table */}
                    <table className="hidden w-full md:table">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Despesa</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Aluno</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Data</th>
                          <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Custo Vinculado</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {projectExpenses.map((exp) => {
                          const linkedCost = (exp.costBreakdowns ?? [])
                            .filter((cb) => cb.projectId === project!.id || !cb.projectId)
                            .reduce((sum, cb) => sum + cb.amount, 0);
                          const studentName = exp.student?.name ?? "—";
                          const date = new Date(exp.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
                          return (
                            <tr key={exp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                              <td className="px-6 py-4">
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">{exp.title}</p>
                                {exp.costBreakdowns && exp.costBreakdowns.length > 0 && (
                                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                    {exp.costBreakdowns.map((cb) => cb.subcategory.name).join(", ")}
                                  </p>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <StudentAvatar name={studentName} />
                                  <span className="text-sm text-gray-700 dark:text-gray-300">{studentName}</span>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{date}</td>
                              <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-50">
                                {linkedCost > 0 ? fmtBRL(linkedCost) : <span className="text-gray-400 font-normal">—</span>}
                              </td>
                              <td className="px-6 py-4"><StatusBadge status={exp.status} /></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Cards — mobile */}
                    <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                      {projectExpenses.map((exp) => {
                        const linkedCost = (exp.costBreakdowns ?? [])
                          .filter((cb) => cb.projectId === project!.id || !cb.projectId)
                          .reduce((sum, cb) => sum + cb.amount, 0);
                        const studentName = exp.student?.name ?? "—";
                        const date = new Date(exp.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
                        return (
                          <div key={exp.id} className="px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 truncate">{exp.title}</p>
                                {exp.costBreakdowns && exp.costBreakdowns.length > 0 && (
                                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                                    {exp.costBreakdowns.map((cb) => cb.subcategory.name).join(", ")}
                                  </p>
                                )}
                              </div>
                              <StatusBadge status={exp.status} />
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-2">
                                <StudentAvatar name={studentName} />
                                <span className="text-xs text-gray-600 dark:text-gray-400">{studentName}</span>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                                  {linkedCost > 0 ? fmtBRL(linkedCost) : "—"}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">{date}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
          {abaAtiva === "expenses" && (
            <div className="flex h-64 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
              <p className="text-sm text-gray-500 dark:text-gray-400">Lista de despesas em breve</p>
            </div>
          )}
          {abaAtiva === "team" && (
            <div className="flex h-64 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
              <p className="text-sm text-gray-500 dark:text-gray-400">Membros da equipe em breve</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
