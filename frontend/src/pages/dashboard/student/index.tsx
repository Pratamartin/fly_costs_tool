import { useState } from "react";
import ModalNovaDespesa, { type NovaDespesaData } from "@/components/ModalNovaDespesa";

type Status = "Pendente" | "Aprovado" | "Rejeitado";
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

// Dados iniciais de exemplo — substituir pelo fetch da API quando o backend estiver pronto
const despesasIniciais: Despesa[] = [
  {
    id: "1",
    data: "28 out. 2025",
    descricao: "Componentes para Arduino",
    reqId: "#REQ-8923",
    projeto: "Laboratório de Robótica",
    valor: 120.0,
    status: "Pendente",
    icone: "componentes",
  },
  {
    id: "2",
    data: "25 out. 2025",
    descricao: "Livros de Machine Learning",
    reqId: "#REQ-8910",
    projeto: "Bolsa de Pesquisa em IA",
    valor: 345.5,
    status: "Aprovado",
    icone: "livros",
  },
  {
    id: "3",
    data: "20 out. 2025",
    descricao: "Passagens para Conferência",
    reqId: "#REQ-8892",
    projeto: "Bolsa de Pesquisa em IA",
    valor: 850.0,
    status: "Rejeitado",
    icone: "viagem",
  },
  {
    id: "4",
    data: "18 out. 2025",
    descricao: "Créditos de Cloud Hosting",
    reqId: "#REQ-8875",
    projeto: "Laboratório de Robótica",
    valor: 330.0,
    status: "Pendente",
    icone: "nuvem",
  },
];

const projetos = ["Todos os Projetos", "Laboratório de Robótica", "Bolsa de Pesquisa em IA"];

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
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-red-200">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
      </svg>
      Rejeitado
    </span>
  );
}

function formatarData(date: Date): string {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function gerarReqId(): string {
  const num = Math.floor(8000 + Math.random() * 1999);
  return `#REQ-${num}`;
}

export default function DashboardAluno() {
  const [despesas, setDespesas] = useState<Despesa[]>(despesasIniciais);
  const [filtro, setFiltro] = useState<Filtro>("Todos");
  const [projeto, setProjeto] = useState("Todos os Projetos");
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);

  // TODO: ao integrar o backend, substituir por POST /solicitacoes e depois re-fetch ou append com o item retornado
  function handleNovaDespesa(data: NovaDespesaData) {
    const nova: Despesa = {
      id: String(Date.now()),
      data: formatarData(new Date()),
      descricao: data.descricao,
      reqId: gerarReqId(),
      projeto: data.projeto,
      valor: data.valor,
      status: "Pendente",
      icone: data.categoria,
    };
    setDespesas((prev) => [nova, ...prev]);
  }

  const totalSubmetido = despesas.reduce((s, d) => s + d.valor, 0);
  const totalPendente = despesas.filter((d) => d.status === "Pendente").reduce((s, d) => s + d.valor, 0);
  const totalAprovado = despesas.filter((d) => d.status === "Aprovado").reduce((s, d) => s + d.valor, 0);

  const despesasFiltradas = despesas.filter((d) => {
    const matchFiltro = filtro === "Todos" || d.status === filtro;
    const matchProjeto = projeto === "Todos os Projetos" || d.projeto === projeto;
    const matchBusca = d.descricao.toLowerCase().includes(busca.toLowerCase()) || d.reqId.toLowerCase().includes(busca.toLowerCase());
    return matchFiltro && matchProjeto && matchBusca;
  });

  const filtros: Filtro[] = ["Todos", "Pendente", "Aprovado", "Rejeitado"];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {modalAberto && <ModalNovaDespesa onClose={() => setModalAberto(false)} onSubmit={handleNovaDespesa} />}

      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col justify-between bg-white border-r border-gray-200 py-6 px-4">
        <div>
          {/* Logo */}
          <div className="mb-8 flex items-center gap-2 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4F46E5]">
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
            Portal do Aluno
          </p>
          <nav className="space-y-1">
            <button className="flex w-full items-center gap-2 rounded-lg bg-[#4F46E5]/10 px-3 py-2 text-sm font-semibold text-[#4F46E5]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              Minhas Solicitações
            </button>
          </nav>
        </div>

        {/* Usuário */}
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#4F46E5] text-sm font-bold text-white">
            S
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-800">Sarah Smith</p>
            <p className="truncate text-xs text-gray-400">Ciência da Computação</p>
          </div>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Topbar */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Minhas Solicitações de Despesa</h1>
            <p className="text-sm text-gray-500">Acompanhe e gerencie suas despesas de projetos acadêmicos</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path d="M4.214 3.227a.75.75 0 00-1.156-.956 8.97 8.97 0 00-1.856 3.826.75.75 0 001.466.316 7.47 7.47 0 011.546-3.186zm11.730-.956a.75.75 0 00-1.156.956 7.47 7.47 0 011.547 3.186.75.75 0 001.466-.316 8.97 8.97 0 00-1.857-3.826zM10 2a6 6 0 00-6 6v1.076l-1.647 2.74A.75.75 0 003 13h14a.75.75 0 00.647-1.184L16 9.076V8a6 6 0 00-6-6zM9 17.5a1.5 1.5 0 003 0H9z" />
              </svg>
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>
            <button
              onClick={() => setModalAberto(true)}
              className="flex items-center gap-2 rounded-lg bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#4338CA]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
              Nova Solicitação
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-6">

          {/* Cards de resumo */}
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
              <div>
                <p className="text-sm text-gray-500">Total Submetido</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  R$ {totalSubmetido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-blue-500">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
              <div>
                <p className="text-sm text-gray-500">Aguardando Aprovação</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  R$ {totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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
                <p className="text-sm text-gray-500">Aprovado (Este Ano)</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
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

          {/* Filtros e tabela */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

            {/* Barra de busca e filtros */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-3">
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
                    className="rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] w-52"
                  />
                </div>
                {/* Filtro de projeto */}
                <div className="relative">
                  <select
                    value={projeto}
                    onChange={(e) => setProjeto(e.target.value)}
                    className="appearance-none rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-sm text-gray-700 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                  >
                    {projetos.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                  </span>
                </div>
              </div>

              {/* Tabs de status */}
              <div className="flex gap-1 rounded-lg border border-gray-200 p-1">
                {filtros.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFiltro(f)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                      filtro === f
                        ? "bg-[#4F46E5] text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Tabela */}
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Despesa</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Projeto</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {despesasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-gray-400">
                      Nenhuma solicitação encontrada.
                    </td>
                  </tr>
                ) : (
                  despesasFiltradas.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50">
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
                      <td className="px-6 py-4 text-right">
                        <button className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                            <path d="M3 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM8.5 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM15.5 8.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Paginação */}
            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
              <p className="text-sm text-gray-500">
                Exibindo {despesasFiltradas.length} de {despesas.length} resultados
              </p>
              <div className="flex items-center gap-1">
                <button className="rounded-lg border border-gray-200 px-2 py-1.5 text-gray-400 hover:bg-gray-50">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                  </svg>
                </button>
                {[1, 2, 3].map((p) => (
                  <button
                    key={p}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                      p === 1
                        ? "border-[#4F46E5] bg-[#4F46E5] text-white"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button className="rounded-lg border border-gray-200 px-2 py-1.5 text-gray-400 hover:bg-gray-50">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
