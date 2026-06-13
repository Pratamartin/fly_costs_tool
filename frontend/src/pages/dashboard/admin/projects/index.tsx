import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuthStore } from "@/store/authStore";
import { getToken } from "@/lib/getToken";
import AdminSidebar from "@/components/AdminSidebar";
import ModalCriarProjeto, { NovoDadosProjeto } from "@/components/ModalCriarProjeto";
import { listProjects, createProject, deleteProject, type Project } from "@/services/projects";
import { toast } from "@/lib/toast";
import ThemeToggle from "@/components/ThemeToggle";

function StatusBadge({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
        Ativo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      Arquivado
    </span>
  );
}

function BudgetBar({ spent, total }: { spent: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((spent / total) * 100)) : 0;
  const barColor = pct >= 100 ? "bg-gray-400" : pct >= 85 ? "bg-amber-400" : "bg-blue-500";
  const fmt = (v: number) => v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`;
  return (
    <div className="min-w-[140px]">
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
        <span>{fmt(spent)} gasto</span>
        <span>de {fmt(total)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 text-right">{pct}%</div>
    </div>
  );
}

export default function AdminProjects() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModalCriar, setShowModalCriar] = useState(false);
  const [criando, setCriando] = useState(false);
  const [erroCriar, setErroCriar] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    carregarProjetos(token);
  }, [router]);

  async function carregarProjetos(token: string) {
    setCarregando(true);
    const result = await listProjects(token, { isActive: undefined });
    if (result.ok) {
      setProjects(result.data);
    } else if (result.error === "UNAUTHORIZED") {
      useAuthStore.getState().clearToken();
      localStorage.removeItem("accessToken");
      router.push("/login");
    } else {
      setErro("Erro ao carregar projetos");
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
      setProjects((prev) => [result.data, ...prev]);
      setShowModalCriar(false);
      toast.success("Projeto criado com sucesso!");
    } else if (result.error === "CONFLICT") {
      setErroCriar("Já existe um projeto com esse código.");
    } else {
      setErroCriar("Erro ao criar projeto. Tente novamente.");
    }
  }

  async function handleArquivar(id: string) {
    const token = getToken();
    if (!token) return;
    const result = await deleteProject(token, id);
    if (result.ok) {
      setProjects((prev) => prev.map((p) => p.id === id ? { ...p, isActive: false } : p));
      toast.success("Projeto arquivado.");
    } else {
      toast.error("Erro ao arquivar projeto");
    }
  }

  const filtered = projects.filter((p) => {
    const matchSearch = search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && p.isActive) ||
      (statusFilter === "archived" && !p.isActive);
    return matchSearch && matchStatus;
  });

  if (carregando) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Carregando projetos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <AdminSidebar active="projects" />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-4">
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-gray-50 sm:text-xl">Projetos</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:text-sm">Gerencie e acompanhe todos os projetos acadêmicos</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            {erro && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5">
                <p className="text-xs text-red-700">{erro}</p>
              </div>
            )}
            <button
              onClick={() => { setErroCriar(null); setShowModalCriar(true); }}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors sm:px-4"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Criar Projeto</span>
              <span className="sm:hidden">Criar</span>
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-4 md:px-8 md:py-6">
          {/* Filters */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px] relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar por nome ou código..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 dark:text-gray-100 bg-white dark:bg-gray-800"
              >
                <option value="all">Todos os Status</option>
                <option value="active">Ativo</option>
                <option value="archived">Arquivado</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">{projects.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-green-600">{projects.filter((p) => p.isActive).length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ativos</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-gray-400 dark:text-gray-500">{projects.filter((p) => !p.isActive).length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Arquivados</p>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="hidden w-full text-sm md:table">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">Projeto</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">Código</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">Orçamento</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-sm text-gray-400 dark:text-gray-500">
                      Nenhum projeto encontrado.
                    </td>
                  </tr>
                ) : filtered.map((project) => (
                  <tr
                    key={project.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    onClick={() => router.push({ pathname: "/dashboard/admin/projects/detail", query: { id: project.id } })}
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900 dark:text-gray-50">{project.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {project.subcategories.slice(0, 3).join(" · ")}
                        {project.subcategories.length > 3 && ` +${project.subcategories.length - 3}`}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-md bg-gray-100 dark:bg-gray-700 px-2.5 py-1 text-xs font-mono font-semibold text-gray-700 dark:text-gray-300">
                        {project.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <BudgetBar spent={project.usedBudget} total={project.budget} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge isActive={project.isActive} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push({ pathname: "/dashboard/admin/projects/detail", query: { id: project.id } });
                          }}
                          className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver detalhes"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        {project.isActive && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Arquivar o projeto "${project.name}"?`)) handleArquivar(project.id);
                            }}
                            className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Arquivar projeto"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Rodapé */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Exibindo {filtered.length} de {projects.length} projetos
              </p>
            </div>

            {/* Cards — mobile */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map((project) => (
                <div
                  key={project.id}
                  className="px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={() => router.push({ pathname: "/dashboard/admin/projects/detail", query: { id: project.id } })}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">{project.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-mono">{project.code}</p>
                    </div>
                    <StatusBadge isActive={project.isActive} />
                  </div>
                  <BudgetBar spent={project.usedBudget} total={project.budget} />
                </div>
              ))}
            </div>
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
