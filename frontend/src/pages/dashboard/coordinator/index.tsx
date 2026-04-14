import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import ModalRejeitar from "@/components/ModalRejeitar";
import { getMe, type UserProfile } from "@/services/user";
import { listExpenses, updateExpenseStatus, type Expense } from "@/services/expenses";

type CategoriaIcone = "componentes" | "livros" | "viagem" | "nuvem";

interface Solicitacao {
  id: string;
  reqId: string;
  descricao: string;
  projeto: string;
  aluno: string;
  avatarInicial: string;
  valor: number;
  dataSubmissao: string;
  icone: CategoriaIcone;
  sugestaoCompra: string;
}

function topicToIcone(topic: string): CategoriaIcone {
  switch (topic) {
    case "PASSAGEM":
      return "viagem";
    case "HOSPEDAGEM":
      return "livros";
    default:
      return "componentes";
  }
}

function formatarData(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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
    valor: parseFloat(expense.amount),
    dataSubmissao: formatarData(expense.createdAt),
    icone: topicToIcone(expense.topic),
    sugestaoCompra: "—",
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
    S: "bg-indigo-500",
    D: "bg-emerald-500",
    J: "bg-amber-500",
    A: "bg-pink-500",
    C: "bg-sky-500",
  };
  const cor = cores[inicial] ?? "bg-gray-500";
  return (
    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${cor} text-xs font-bold text-white`}>
      {inicial}
    </div>
  );
}

export default function DashboardCoordenador() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [pendentes, setPendentes] = useState<Solicitacao[]>([]);
  const [busca, setBusca] = useState("");
  const [rejeitando, setRejeitando] = useState<Solicitacao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const carregarDados = async () => {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        // Carregar perfil do usuário
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

        // Carregar despesas pendentes
        const expensesResult = await listExpenses(token, "PENDENTE");
        if (expensesResult.ok) {
          const solicitacoes = expensesResult.data.map(expenseToSolicitacao);
          setPendentes(solicitacoes);
        } else if (expensesResult.error === "UNAUTHORIZED") {
          localStorage.removeItem("accessToken");
          router.push("/login");
        } else {
          setErro("Erro ao carregar despesas");
        }
      } catch (_err) {
        setErro("Erro de conexão com o servidor");
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, [router]);

  const totalValor = pendentes.reduce((s, d) => s + d.valor, 0);

  const filtradas = pendentes.filter(
    (s) =>
      s.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      s.reqId.toLowerCase().includes(busca.toLowerCase()) ||
      s.aluno.toLowerCase().includes(busca.toLowerCase())
  );

  async function handleAprovar(id: string) {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const result = await updateExpenseStatus(token, id, "APROVADO");
      if (result.ok) {
        setPendentes((prev) => prev.filter((s) => s.id !== id));
      } else if (result.error === "CONFLICT") {
        setErro("Esta despesa já foi decidida");
      } else {
        setErro("Erro ao aprovar despesa");
      }
    } catch (_err) {
      setErro("Erro de conexão");
    }
  }

  async function handleRejeitar(id: string, _motivo: string) {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const result = await updateExpenseStatus(token, id, "REJEITADO");
      if (result.ok) {
        setPendentes((prev) => prev.filter((s) => s.id !== id));
        setRejeitando(null);
      } else if (result.error === "CONFLICT") {
        setErro("Esta despesa já foi decidida");
      } else {
        setErro("Erro ao rejeitar despesa");
      }
    } catch (_err) {
      setErro("Erro de conexão");
    }
  }

  if (carregando) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <svg className="animate-spin h-8 w-8 text-[#2563EB]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {rejeitando && (
        <ModalRejeitar
          solicitacao={rejeitando}
          onClose={() => setRejeitando(null)}
          onConfirmar={(motivo) => handleRejeitar(rejeitando.id, motivo)}
        />
      )}

      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col justify-between bg-white border-r border-gray-200 py-6 px-4">
        <div>
          {/* Logo */}
          <div className="mb-8 flex items-center gap-2 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a5c38]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="h-5 w-5">
                <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
                <path d="M13.06 15.473a48.45 48.45 0 017.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 01-.46.71 47.878 47.878 0 00-8.105 4.342.75.75 0 01-.832 0 47.877 47.877 0 00-8.104-4.342.75.75 0 01-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 016 13.18v1.27a1.5 1.5 0 00-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.729 6.729 0 00.551-1.608 1.5 1.5 0 00.14-2.67v-.645a48.549 48.549 0 013.44 1.668 2.25 2.25 0 002.12 0z" />
                <path d="M4.462 19.462c.42-.419.753-.89 1-1.394.453.213.902.434 1.347.661a6.743 6.743 0 01-1.286 1.794.75.75 0 11-1.06-1.06z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-gray-800">SGDA</span>
          </div>

          {/* Nav */}
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Portal do Coordenador
          </p>
          <nav className="space-y-1">
            <button className="flex w-full items-center justify-between rounded-lg bg-[#1a5c38]/10 px-3 py-2 text-sm font-semibold text-[#1a5c38]">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                </svg>
                Pendentes
              </div>
              {pendentes.length > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#1a5c38] px-1.5 text-[10px] font-bold text-white">
                  {pendentes.length}
                </span>
              )}
            </button>
            <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
              Processados
            </button>
          </nav>
        </div>

        {/* Usuário */}
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1a5c38] text-sm font-bold text-white">
            {userProfile?.name.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-800">{userProfile?.name || "Carregando..."}</p>
            <p className="truncate text-xs text-gray-400">Dept. Coordenador</p>
          </div>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Topbar */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Pendentes de Aprovação</h1>
            <p className="text-sm text-gray-500">Revise e processe as solicitações de despesa dos alunos</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Mensagem de erro */}
            {erro && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                <p className="text-sm text-red-700">{erro}</p>
              </div>
            )}
            {/* Busca */}
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
                className="rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#1a5c38] focus:ring-1 focus:ring-[#1a5c38] w-56"
              />
            </div>
            {/* Notificação */}
            <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path d="M4.214 3.227a.75.75 0 00-1.156-.956 8.97 8.97 0 00-1.856 3.826.75.75 0 001.466.316 7.47 7.47 0 011.546-3.186zm11.730-.956a.75.75 0 00-1.156.956 7.47 7.47 0 011.547 3.186.75.75 0 001.466-.316 8.97 8.97 0 00-1.857-3.826zM10 2a6 6 0 00-6 6v1.076l-1.647 2.74A.75.75 0 003 13h14a.75.75 0 00.647-1.184L16 9.076V8a6 6 0 00-6-6zM9 17.5a1.5 1.5 0 003 0H9z" />
              </svg>
              {pendentes.length > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-6">

          {/* Cards de resumo */}
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
              <div>
                <p className="text-sm text-gray-500">Total Pendente</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {pendentes.length} <span className="text-base font-medium text-gray-400">solicitações</span>
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-50">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-yellow-500">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
              <div>
                <p className="text-sm text-gray-500">Valor Total em Análise</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  R$ {totalValor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-blue-500">
                  <path d="M10.75 10.818v2.614A3.13 3.13 0 0011.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 00-1.138-.432zM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.5l-.246.11a1 1 0 10.832 1.81l.214-.097v2.87c-.537-.09-1.06-.284-1.52-.55a2.5 2.5 0 01-.822-.803 2 2 0 01-.367-1.19c0-.558.208-1.067.573-1.47.368-.407.876-.676 1.453-.789V5.75a.75.75 0 011.5 0v.324c.577.113 1.085.382 1.453.789.365.403.573.912.573 1.47 0 .558-.208 1.067-.573 1.47-.368.407-.876.676-1.453.789v2.498c.537.09 1.06.284 1.52.55.475.275.862.644 1.105 1.09.238.437.364.942.364 1.502 0 .558-.126 1.065-.364 1.502-.243.446-.63.815-1.105 1.09-.46.266-.983.46-1.52.55V17.25a.75.75 0 01-1.5 0v-.324a4.63 4.63 0 01-1.453-.789 3.476 3.476 0 01-1.105-1.09A3.005 3.005 0 015 13.628c0-.558.126-1.065.364-1.502.243-.446.63-.815 1.105-1.09.46-.266.983-.46 1.52-.55V7.986a2.614 2.614 0 00-.736-.363 2.116 2.116 0 01-.184-.164L8.33 8.62z" />
                </svg>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
              <div>
                <p className="text-sm text-gray-500">Maior Solicitação</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {pendentes.length > 0
                    ? `R$ ${Math.max(...pendentes.map((s) => s.valor)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                    : "—"}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-purple-500">
                  <path fillRule="evenodd" d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-4.72 4.72a.75.75 0 01-1.06-1.061l5.25-5.25a.75.75 0 011.06 0l3.074 3.073a20.923 20.923 0 015.545-4.931l-3.042-.815a.75.75 0 01-.53-.918z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* Tabela */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-sm font-semibold text-gray-700">
                {filtradas.length === pendentes.length
                  ? `${pendentes.length} solicitações aguardando revisão`
                  : `${filtradas.length} resultado${filtradas.length !== 1 ? "s" : ""} encontrado${filtradas.length !== 1 ? "s" : ""}`}
              </h2>
            </div>

            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Solicitação</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Projeto</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Aluno</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Sugestão de Compra</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Data</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6 text-green-500">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-600">
                          {busca ? "Nenhuma solicitação encontrada." : "Nenhuma solicitação pendente."}
                        </p>
                        {!busca && (
                          <p className="text-xs text-gray-400">Todas as solicitações foram processadas.</p>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtradas.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <IconeSolicitacao tipo={s.icone} />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{s.descricao}</p>
                            <p className="text-xs text-gray-400">{s.reqId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-[#1a5c38]/10 px-2.5 py-1 text-xs font-medium text-[#1a5c38] ring-1 ring-[#1a5c38]/20">
                          {s.projeto}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <AvatarAluno inicial={s.avatarInicial} />
                          <span className="text-sm text-gray-700">{s.aluno}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                        R$ {s.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-[160px] truncate">
                        {s.sugestaoCompra || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {s.dataSubmissao}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
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
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="border-t border-gray-100 px-6 py-4">
              <p className="text-sm text-gray-400">
                Exibindo {filtradas.length} de {pendentes.length} solicitações pendentes
              </p>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
