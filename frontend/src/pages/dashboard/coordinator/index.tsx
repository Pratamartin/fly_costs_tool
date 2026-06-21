import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuthStore } from "@/store/authStore";
import { getToken } from "@/lib/getToken";
import { performLogout } from "@/lib/logout";
import ModalRejeitar from "@/components/ModalRejeitar";
import CoordinatorSidebar from "@/components/CoordinatorSidebar";
import ModalDetalhe from "@/components/ModalDetalhe";
import ModalFiltroRelatorio from "@/components/ModalFiltroRelatorio";
import { getMe, type UserProfile } from "@/services/user";
import { listExpenses, updateExpenseStatus, getExpenseById, exportExpensesReport, type Expense, type ReportFilters } from "@/services/expenses";
import { listProjects } from "@/services/projects";
import NotificationsPanel from "@/components/NotificationsPanel";
import { toast } from "@/lib/toast";
import ThemeToggle from "@/components/ThemeToggle";

type CategoriaIcone = "componentes" | "livros" | "viagem" | "nuvem";

interface Solicitacao {
  id: string;
  reqId: string;
  descricao: string;
  projeto: string;
  aluno: string;
  avatarInicial: string;
  dataSubmissao: string;
  icone: CategoriaIcone;
}


function formatarData(dateString: string): string {
  return new Date(dateString).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function expenseToSolicitacao(expense: Expense): Solicitacao {
  const inicial = expense.student?.name.charAt(0).toUpperCase() || "?";
  return {
    id: expense.id,
    reqId: `REQ-${expense.id.slice(0, 8).toUpperCase()}`,
    descricao: expense.title,
    projeto: expense.project?.name || "Sem projeto",
    aluno: expense.student?.name || "Aluno",
    avatarInicial: inicial,
    dataSubmissao: formatarData(expense.createdAt),
    icone: "viagem",
  };
}

function IconeSolicitacao({ tipo }: { tipo: CategoriaIcone }) {
  const base = "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg";
  if (tipo === "componentes")
    return (
      <span className={`${base} bg-purple-100`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-purple-600">
          <path fillRule="evenodd" d="M14.5 10a4.5 4.5 0 004.284-5.882c-.105-.324-.51-.391-.752-.15L15.34 6.66a.454.454 0 01-.493.11 3.01 3.01 0 01-1.618-1.616.455.455 0 01.11-.494l2.694-2.692c.24-.241.174-.647-.15-.752a4.5 4.5 0 00-5.873 4.575c.055.873-.128 1.808-.8 2.368l-7.23 6.024a2.724 2.724 0 103.837 3.837l6.024-7.23c.56-.672 1.495-.855 2.368-.8.096.007.193.01.291.01zM5 16a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
        </svg>
      </span>
    );
  if (tipo === "livros")
    return (
      <span className={`${base} bg-blue-100`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-blue-600">
          <path d="M10.75 16.82A7.462 7.462 0 0115 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0018 15.06v-11a.75.75 0 00-.546-.721A9.006 9.006 0 0015 3a8.963 8.963 0 00-4.25 1.065V16.82zM9.25 4.065A8.963 8.963 0 005 3c-.85 0-1.673.118-2.454.339A.75.75 0 002 4.06v11a.75.75 0 00.954.721A7.506 7.506 0 015 15.5c1.579 0 3.042.487 4.25 1.32V4.065z" />
        </svg>
      </span>
    );
  if (tipo === "viagem")
    return (
      <span className={`${base} bg-sky-100`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-sky-600">
          <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
          <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
        </svg>
      </span>
    );
  return (
    <span className={`${base} bg-gray-100`}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-gray-600">
        <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" />
      </svg>
    </span>
  );
}

function AvatarAluno({ inicial }: { inicial: string }) {
  const cores: Record<string, string> = {
    S: "bg-indigo-500", D: "bg-emerald-500", J: "bg-amber-500",
    A: "bg-pink-500", C: "bg-sky-500",
  };
  return (
    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${cores[inicial] ?? "bg-gray-500"} text-xs font-bold text-white`}>
      {inicial}
    </div>
  );
}

type TabType = "PENDENTE" | "APROVADO" | "REJEITADO";

export default function DashboardCoordenador() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [despesas, setDespesas] = useState<Record<TabType, Solicitacao[]>>({
    PENDENTE: [], APROVADO: [], REJEITADO: [],
  });
  const [abaAtual, setAbaAtual] = useState<TabType>("PENDENTE");
  const [busca, setBusca] = useState("");
  const [rejeitando, setRejeitando] = useState<Solicitacao | null>(null);
  const [detalheAberto, setDetalheAberto] = useState<Expense | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const carregarDados = async () => {
      const token = getToken();
      if (!token) { router.push("/login"); return; }
      try {
        const [meResult, pendingResult, approvedResult, rejectedResult, projectsResult] = await Promise.all([
          getMe(token),
          listExpenses(token, "PENDENTE"),
          listExpenses(token, "APROVADO"),
          listExpenses(token, "REJEITADO"),
          listProjects(token),
        ]);
        if (projectsResult.ok) setProjects(projectsResult.data.map((p) => ({ id: p.id, name: p.name })));
        if (!meResult.ok) {
          if (meResult.error === "UNAUTHORIZED") { useAuthStore.getState().clearToken(); localStorage.removeItem("accessToken"); router.push("/login"); }
          else setErro("Erro ao carregar perfil");
          return;
        }
        setUserProfile(meResult.data);
        if (
          (!pendingResult.ok && pendingResult.error === "UNAUTHORIZED") ||
          (!approvedResult.ok && approvedResult.error === "UNAUTHORIZED") ||
          (!rejectedResult.ok && rejectedResult.error === "UNAUTHORIZED")
        ) {
          useAuthStore.getState().clearToken();
          localStorage.removeItem("accessToken");
          router.push("/login");
          return;
        }
        setDespesas({
          PENDENTE: pendingResult.ok ? pendingResult.data.map(expenseToSolicitacao) : [],
          APROVADO: approvedResult.ok ? approvedResult.data.map(expenseToSolicitacao) : [],
          REJEITADO: rejectedResult.ok ? rejectedResult.data.map(expenseToSolicitacao) : [],
        });
      } catch (_err) {
        setErro("Erro de conexão com o servidor");
      } finally {
        setCarregando(false);
      }
    };
    carregarDados();
  }, [router]);

  async function handleExport(filters: ReportFilters) {
    const token = getToken();
    if (!token) return;
    setExporting(true);
    try {
      const result = await exportExpensesReport(token, filters);
      if (!result.ok) {
        toast.error("Erro ao gerar relatório. Tente novamente.");
        return;
      }
      setShowReportModal(false);
      window.open(result.downloadUrl, "_blank");
    } catch {
      toast.error("Erro inesperado ao gerar relatório.");
    } finally {
      setExporting(false);
    }
  }

  async function handleLogout() {
    toast.success("Sessão encerrada com sucesso.");
    await performLogout(router);
  }

  async function abrirDetalhe(id: string) {
    const token = getToken();
    if (!token) return;
    try {
      const result = await getExpenseById(token, id);
      if (result.ok) setDetalheAberto(result.data);
      else setErro("Erro ao carregar detalhe da despesa");
    } catch (_err) {
      setErro("Erro de conexão");
    }
  }

  async function handleAprovar(id: string) {
    const token = getToken();
    if (!token) return;
    try {
      const result = await updateExpenseStatus(token, id, "APROVADO");
      if (result.ok) {
        setDespesas((prev) => ({
          ...prev,
          PENDENTE: prev.PENDENTE.filter((s) => s.id !== id),
          APROVADO: [...prev.APROVADO, expenseToSolicitacao(result.data)],
        }));
        toast.success("Despesa aprovada com sucesso!");
      } else if (result.error === "CONFLICT") {
        toast.error("Esta despesa já foi decidida");
      } else {
        toast.error("Erro ao aprovar despesa");
      }
    } catch (_err) {
      setErro("Erro de conexão");
    }
  }

  async function handleRejeitar(id: string, motivo: string) {
    const token = getToken();
    if (!token) return;
    try {
      const result = await updateExpenseStatus(token, id, "REJEITADO", motivo);
      if (result.ok) {
        setDespesas((prev) => ({
          ...prev,
          PENDENTE: prev.PENDENTE.filter((s) => s.id !== id),
          REJEITADO: [...prev.REJEITADO, expenseToSolicitacao(result.data)],
        }));
        setRejeitando(null);
        toast.success("Despesa rejeitada.");
      } else if (result.error === "CONFLICT") {
        toast.error("Esta despesa já foi decidida");
      } else {
        toast.error("Erro ao rejeitar despesa");
      }
    } catch (_err) {
      setErro("Erro de conexão");
    }
  }

  const pendentesAtual = despesas[abaAtual];
  const filtradas = pendentesAtual.filter(
    (s) =>
      (s.descricao?.toLowerCase() ?? "").includes(busca.toLowerCase()) ||
      (s.reqId?.toLowerCase() ?? "").includes(busca.toLowerCase()) ||
      (s.aluno?.toLowerCase() ?? "").includes(busca.toLowerCase())
  );

  const tituloAba = abaAtual === "PENDENTE" ? "Pendentes de Aprovação"
    : abaAtual === "APROVADO" ? "Solicitações Aprovadas"
    : "Solicitações Rejeitadas";

  const subtituloAba = abaAtual === "PENDENTE" ? "Revise e processe as solicitações dos alunos"
    : abaAtual === "APROVADO" ? "Histórico de solicitações aprovadas"
    : "Histórico de solicitações rejeitadas";

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
          <p className="text-gray-600 dark:text-gray-400">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {rejeitando && (
        <ModalRejeitar
          solicitacao={rejeitando}
          onClose={() => setRejeitando(null)}
          onConfirmar={(motivo) => handleRejeitar(rejeitando.id, motivo)}
        />
      )}
      {detalheAberto && (
        <ModalDetalhe
          despesa={detalheAberto}
          token={getToken()}
          onClose={() => setDetalheAberto(null)}
        />
      )}
      {showReportModal && (
        <ModalFiltroRelatorio
          onClose={() => setShowReportModal(false)}
          onExportar={handleExport}
          exporting={exporting}
          projects={projects}
        />
      )}

      <CoordinatorSidebar
        active={abaAtual}
        onTabChange={setAbaAtual}
        counts={{ PENDENTE: despesas.PENDENTE.length, APROVADO: despesas.APROVADO.length, REJEITADO: despesas.REJEITADO.length }}
        userName={userProfile?.name ?? null}
        onLogout={handleLogout}
      />

      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Header */}
        <header className="flex flex-col gap-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-4">
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-gray-50 sm:text-xl">{tituloAba}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">{subtituloAba}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            {erro && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5">
                <p className="text-xs text-red-700 sm:text-sm">{erro}</p>
              </div>
            )}
            <div className="relative flex-1 sm:flex-none">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400 dark:text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                </svg>
              </span>
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar..."
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 pl-9 pr-4 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-[#1a5c38] focus:ring-1 focus:ring-[#1a5c38] sm:w-56"
              />
            </div>
            <button
              onClick={() => setShowReportModal(true)}
              className="flex shrink-0 items-center gap-2 rounded-lg bg-[#1a5c38] px-3 py-2 text-sm font-semibold text-white hover:bg-[#14472b] transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm4.75 6.75a.75.75 0 011.5 0v2.546l.943-1.048a.75.75 0 111.114 1.004l-2.25 2.5a.75.75 0 01-1.114 0l-2.25-2.5a.75.75 0 111.114-1.004l.943 1.048V8.75z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">Exportar PDF</span>
            </button>
            <NotificationsPanel role="coordinator" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6">

          {/* Cards de resumo */}
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-4 shadow-sm sm:px-6 sm:py-5">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total {abaAtual === "PENDENTE" ? "Pendente" : abaAtual === "APROVADO" ? "Aprovado" : "Rejeitado"}
                </p>
                <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-50 sm:text-2xl">
                  {filtradas.length} <span className="text-base font-medium text-gray-400 dark:text-gray-500">solicitações</span>
                </p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                abaAtual === "PENDENTE" ? "bg-yellow-50" : abaAtual === "APROVADO" ? "bg-green-50" : "bg-red-50"
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`h-5 w-5 ${
                  abaAtual === "PENDENTE" ? "text-yellow-500" : abaAtual === "APROVADO" ? "text-green-500" : "text-red-500"
                }`}>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-4 shadow-sm sm:px-6 sm:py-5">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pendentes</p>
                <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-50 sm:text-2xl">
                  {despesas.PENDENTE.length} <span className="text-base font-medium text-gray-400 dark:text-gray-500">solicitações</span>
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-50">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-yellow-500">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-4 shadow-sm sm:px-6 sm:py-5">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Aprovadas</p>
                <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-50 sm:text-2xl">
                  {despesas.APROVADO.length} <span className="text-base font-medium text-gray-400 dark:text-gray-500">solicitações</span>
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-green-500">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* Tabela / Cards */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
            <div className="border-b border-gray-100 dark:border-gray-800 px-4 py-3 sm:px-6 sm:py-4">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {filtradas.length === pendentesAtual.length
                  ? `${pendentesAtual.length} solicitações`
                  : `${filtradas.length} resultado${filtradas.length !== 1 ? "s" : ""} encontrado${filtradas.length !== 1 ? "s" : ""}`}
              </h2>
            </div>

            {/* Tabela — desktop */}
            <table className="hidden w-full md:table">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Solicitação</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Projeto</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Aluno</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Data</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtradas.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6 text-green-500">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {busca ? "Nenhuma solicitação encontrada." : "Nenhuma solicitação neste status."}
                        </p>
                        {!busca && (
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {abaAtual === "PENDENTE" && "Todas as solicitações foram processadas."}
                            {abaAtual === "APROVADO" && "Nenhuma solicitação aprovada ainda."}
                            {abaAtual === "REJEITADO" && "Nenhuma solicitação rejeitada ainda."}
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtradas.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4">
                        <button onClick={() => abrirDetalhe(s.id)} className="flex items-center gap-3 hover:opacity-75">
                          <IconeSolicitacao tipo={s.icone} />
                          <div className="text-left">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">{s.descricao}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{s.reqId}</p>
                          </div>
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-[#1a5c38]/10 px-2.5 py-1 text-xs font-medium text-[#1a5c38] ring-1 ring-[#1a5c38]/20">
                          {s.projeto}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <AvatarAluno inicial={s.avatarInicial} />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{s.aluno}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{s.dataSubmissao}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {abaAtual === "PENDENTE" && (
                            <>
                              <button
                                onClick={() => handleAprovar(s.id)}
                                className="flex items-center gap-1.5 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-green-600 transition"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                </svg>
                                Aprovar
                              </button>
                              <button
                                onClick={() => setRejeitando(s)}
                                className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                </svg>
                                Rejeitar
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => abrirDetalhe(s.id)}
                            className="flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                              <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                              <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41z" clipRule="evenodd" />
                            </svg>
                            Detalhe
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Cards — mobile */}
            <div className="md:hidden">
              {filtradas.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6 text-green-500">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {busca ? "Nenhuma solicitação encontrada." : "Nenhuma solicitação neste status."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtradas.map((s) => (
                    <div key={s.id} className="px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                      {/* Linha 1: ícone + descrição */}
                      <div className="flex items-center gap-3 min-w-0 mb-2">
                        <IconeSolicitacao tipo={s.icone} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 truncate">{s.descricao}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{s.reqId}</p>
                        </div>
                      </div>
                      {/* Linha 2: aluno + data */}
                      <div className="flex items-center justify-between pl-11 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <AvatarAluno inicial={s.avatarInicial} />
                          <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{s.aluno}</span>
                        </div>
                        <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">{s.dataSubmissao}</span>
                      </div>
                      {/* Linha 3: projeto */}
                      <div className="pl-11 mb-3">
                        <span className="inline-flex items-center rounded-full bg-[#1a5c38]/10 px-2.5 py-1 text-xs font-medium text-[#1a5c38] ring-1 ring-[#1a5c38]/20">
                          {s.projeto}
                        </span>
                      </div>
                      {/* Linha 4: ações */}
                      <div className="flex items-center gap-2 pl-11">
                        {abaAtual === "PENDENTE" && (
                          <>
                            <button
                              onClick={() => handleAprovar(s.id)}
                              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-500 px-3 py-2 text-xs font-semibold text-white hover:bg-green-600 transition"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                              </svg>
                              Aprovar
                            </button>
                            <button
                              onClick={() => setRejeitando(s)}
                              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                              </svg>
                              Rejeitar
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => abrirDetalhe(s.id)}
                          className="flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                            <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                            <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41z" clipRule="evenodd" />
                          </svg>
                          Detalhe
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-3 sm:px-6 sm:py-4">
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Exibindo {filtradas.length} de {pendentesAtual.length} solicitações
              </p>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
