import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import ModalNovaDespesa, { type NovaDespesaData } from "@/components/ModalNovaDespesa";
import StudentSidebar from "@/components/StudentSidebar";
import NotificationsPanel from "@/components/NotificationsPanel";
import { getMe, type UserProfile } from "@/services/user";
import { listExpenses, createExpense, uploadMemorandum, type Expense } from "@/services/expenses";

type Status = "Pendente" | "Aprovado" | "Em Processamento" | "Rejeitado" | "Correção Solicitada" | "Concluído";
type Filtro = "Todos" | Status;

interface Despesa {
  id: string;
  data: string;
  descricao: string;
  reqId: string;
  projeto: string;
  valor: number;
  status: Status;
  icone: "componentes" | "livros" | "viagem" | "nuvem";
}


function statusBackendToFrontend(status: string): Status {
  switch (status) {
    case "PENDENTE": return "Pendente";
    case "APROVADO": return "Aprovado";
    case "EM_PROCESSAMENTO": return "Em Processamento";
    case "REJEITADO": return "Rejeitado";
    case "EM_EDICAO": return "Correção Solicitada";
    case "CONCLUIDO": return "Concluído";
    default: return "Pendente";
  }
}

function expenseToDespesa(expense: Expense): Despesa {
  const valor = (expense.costBreakdowns ?? []).reduce((sum, cb) => sum + cb.amount, 0);
  return {
    id: expense.id,
    data: new Date(expense.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }),
    descricao: expense.title,
    reqId: `#REQ-${expense.id.slice(0, 8).toUpperCase()}`,
    projeto: expense.project?.name || "Sem projeto",
    valor,
    status: statusBackendToFrontend(expense.status),
    icone: "viagem",
  };
}

function IconeDespesa({ tipo }: { tipo: Despesa["icone"] }) {
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
          <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
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

function BadgeStatus({ status }: { status: Status }) {
  if (status === "Pendente")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700 ring-1 ring-yellow-200">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
        </svg>
        Pendente
      </span>
    );
  if (status === "Aprovado")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 ring-1 ring-green-200">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
        </svg>
        Aprovado
      </span>
    );
  if (status === "Em Processamento")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
          <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
        </svg>
        Em Processamento
      </span>
    );
  if (status === "Correção Solicitada")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
        Correção Solicitada
      </span>
    );
  if (status === "Concluído")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 ring-1 ring-violet-200">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
        </svg>
        Concluído
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-red-200">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
      </svg>
      Rejeitado
    </span>
  );
}

export default function DashboardAluno() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [filtro, setFiltro] = useState<Filtro>("Todos");
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [criandoDespesa, setCriandoDespesa] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  async function carregarDespesas(token: string) {
    const expensesResult = await listExpenses(token);
    if (expensesResult.ok) {
      setDespesas(expensesResult.data.map(expenseToDespesa));
    } else if (expensesResult.error === "UNAUTHORIZED") {
      localStorage.removeItem("accessToken");
      router.push("/login");
    } else {
      setErro("Erro ao carregar despesas");
    }
  }

  useEffect(() => {
    if (router.query.toast === "correctionSubmitted") {
      setToastMsg("Correção enviada com sucesso! A despesa voltou para revisão.");
      router.replace("/dashboard/student", undefined, { shallow: true });
      const t = setTimeout(() => setToastMsg(null), 5000);
      return () => clearTimeout(t);
    }
  }, [router.query.toast]);

  useEffect(() => {
    const carregarDados = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) { router.push("/login"); return; }
      try {
        const meResult = await getMe(token);
        if (!meResult.ok) {
          if (meResult.error === "UNAUTHORIZED") {
            localStorage.removeItem("accessToken");
            router.push("/login");
          } else {
            setErro("Erro ao carregar perfil");
          }
          return;
        }
        setUserProfile(meResult.data);
        await carregarDespesas(token);
      } catch (_err) {
        setErro("Erro de conexão com o servidor");
      } finally {
        setCarregando(false);
      }
    };
    carregarDados();
  }, [router]);

  async function handleAtualizar() {
    const token = localStorage.getItem("accessToken");
    if (!token || atualizando) return;
    setAtualizando(true);
    setErro(null);
    try {
      await carregarDespesas(token);
    } catch (_err) {
      setErro("Erro de conexão");
    } finally {
      setAtualizando(false);
    }
  }

  async function handleLogout() {
    localStorage.removeItem("accessToken");
    router.push("/login");
  }

  async function handleNovaDespesa(data: NovaDespesaData) {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    setCriandoDespesa(true);
    setErro(null);
    try {
      const result = await createExpense(token, {
        title: data.title,
        description: data.description,
        event: data.event,
        article: data.article,
        surveyAnswers: data.surveyAnswers,
      });
      if (result.ok) {
        if (data.memorando) {
          await uploadMemorandum(token, result.data.id, data.memorando);
        }
        setDespesas((prev) => [expenseToDespesa(result.data), ...prev]);
        setModalAberto(false);
      } else if (result.error === "UNAUTHORIZED") {
        localStorage.removeItem("accessToken");
        router.push("/login");
      } else if (result.error === "VALIDATION_ERROR") {
        setErro("Dados inválidos. Verifique os campos.");
      } else {
        setErro("Erro ao criar despesa");
      }
    } catch (_err) {
      setErro("Erro de conexão");
    } finally {
      setCriandoDespesa(false);
    }
  }

  const totalSubmetido = despesas.reduce((s, d) => s + d.valor, 0);
  const totalPendente = despesas.filter((d) => d.status === "Pendente").reduce((s, d) => s + d.valor, 0);
  const totalAprovado = despesas.filter((d) => d.status === "Aprovado").reduce((s, d) => s + d.valor, 0);

  const despesasFiltradas = despesas.filter((d) => {
    const matchFiltro = filtro === "Todos" || d.status === filtro;
    const matchBusca =
      (d.descricao?.toLowerCase() ?? "").includes(busca.toLowerCase()) ||
      (d.reqId?.toLowerCase() ?? "").includes(busca.toLowerCase());
    return matchFiltro && matchBusca;
  });

  const filtros: Filtro[] = ["Todos", "Pendente", "Em Processamento", "Aprovado", "Correção Solicitada", "Rejeitado", "Concluído"];

  if (carregando) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <svg className="animate-spin h-8 w-8 text-[#4F46E5]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {modalAberto && (
        <ModalNovaDespesa
          onClose={() => setModalAberto(false)}
          onSubmit={handleNovaDespesa}
          carregando={criandoDespesa}
          erro={erro}
        />
      )}

      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-3 shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 shrink-0 text-green-600">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
          <p className="text-sm font-medium text-green-800">{toastMsg}</p>
          <button onClick={() => setToastMsg(null)} className="ml-2 text-green-500 hover:text-green-700">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
      )}

      <StudentSidebar userName={userProfile?.name ?? null} onLogout={handleLogout} />

      {/* Conteúdo principal */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Header */}
        <header className="flex flex-col gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-4">
          <div>
            <h1 className="text-base font-bold text-gray-900 sm:text-xl">Minhas Solicitações</h1>
            <p className="text-xs text-gray-500 sm:text-sm">Acompanhe e gerencie suas despesas acadêmicas</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {erro && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5">
                <p className="text-xs text-red-700 sm:text-sm">{erro}</p>
              </div>
            )}
            <button
              onClick={handleAtualizar}
              disabled={atualizando}
              title="Atualizar lista"
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`h-5 w-5 ${atualizando ? "animate-spin" : ""}`}>
                <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.389zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
              </svg>
            </button>
            <NotificationsPanel role="student" />
            <button
              onClick={() => setModalAberto(true)}
              disabled={criandoDespesa}
              className="flex items-center gap-2 rounded-lg bg-[#4F46E5] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#4338CA] disabled:opacity-50 sm:px-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
              <span className="hidden sm:inline">Nova Solicitação</span>
              <span className="sm:hidden">Nova</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6">

          {/* Cards de resumo */}
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm sm:px-6 sm:py-5">
              <div>
                <p className="text-sm text-gray-500">Total Submetido</p>
                <p className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
                  R$ {totalSubmetido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-blue-500">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm sm:px-6 sm:py-5">
              <div>
                <p className="text-sm text-gray-500">Aguardando Aprovação</p>
                <p className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
                  R$ {totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-50">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-yellow-500">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm sm:px-6 sm:py-5">
              <div>
                <p className="text-sm text-gray-500">Aprovado (Este Ano)</p>
                <p className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
                  R$ {totalAprovado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-green-500">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* Tabela / Cards */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

            {/* Toolbar: busca + filtros */}
            <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar solicitações..."
                  className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] sm:w-52"
                />
              </div>
              <div className="flex gap-1 rounded-lg border border-gray-200 p-1 overflow-x-auto">
                {filtros.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFiltro(f)}
                    className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition ${
                      filtro === f ? "bg-[#4F46E5] text-white shadow-sm" : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Tabela — desktop */}
            <table className="hidden w-full md:table">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Despesa</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Projeto</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {despesasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-gray-400">
                      Nenhuma solicitação encontrada.
                    </td>
                  </tr>
                ) : (
                  despesasFiltradas.map((d) => (
                    <tr
                      key={d.id}
                      onClick={
                        d.status === "Correção Solicitada"
                          ? () => router.push(`/dashboard/student/expenses/edit/${d.id}`)
                          : d.status === "Concluído"
                          ? () => router.push(`/dashboard/student/expenses/detail/${d.id}`)
                          : undefined
                      }
                      className={`hover:bg-gray-50 ${d.status === "Correção Solicitada" || d.status === "Concluído" ? "cursor-pointer" : ""}`}
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{d.data}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <IconeDespesa tipo={d.icone} />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{d.descricao}</p>
                            <p className="text-xs text-gray-400">Req ID: {d.reqId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{d.projeto}</td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                        R$ {d.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        <BadgeStatus status={d.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Cards — mobile */}
            <div className="md:hidden">
              {despesasFiltradas.length === 0 ? (
                <p className="py-12 text-center text-sm text-gray-400">Nenhuma solicitação encontrada.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {despesasFiltradas.map((d) => (
                    <div
                      key={d.id}
                      onClick={
                        d.status === "Correção Solicitada"
                          ? () => router.push(`/dashboard/student/expenses/edit/${d.id}`)
                          : d.status === "Concluído"
                          ? () => router.push(`/dashboard/student/expenses/detail/${d.id}`)
                          : undefined
                      }
                      className={`px-4 py-4 hover:bg-gray-50 ${d.status === "Correção Solicitada" || d.status === "Concluído" ? "cursor-pointer" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <IconeDespesa tipo={d.icone} />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{d.descricao}</p>
                            <p className="text-xs text-gray-400">{d.reqId}</p>
                          </div>
                        </div>
                        <BadgeStatus status={d.status} />
                      </div>
                      <div className="flex items-center justify-between pl-11">
                        <p className="text-xs text-gray-500 truncate mr-2">{d.projeto}</p>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-gray-900">
                            R$ {d.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-gray-400">{d.data}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 px-4 py-3 sm:px-6 sm:py-4">
              <p className="text-sm text-gray-500">
                Exibindo {despesasFiltradas.length} de {despesas.length} resultados
              </p>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
