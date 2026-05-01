import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminSidebar from "@/components/AdminSidebar";

type StatusType = "Pending" | "Approved" | "Rejected";

interface ExpenseDetail {
  id: string;
  projectName: string;
  projectId: string;
  department: string;
  projectStatus: "Ativo" | "Concluído" | "Pausado";
  category: string;
  amount: number;
  budgetTotal: number;
  budgetSpent: number;
  description: string;
  submittedAt: string;
  submittedAgo: string;
  status: StatusType;
  submitter: {
    name: string;
    role: string;
    email: string;
    phone: string;
    dept: string;
    avatarUrl?: string;
  };
  documents: { name: string; size: string; date: string; type: "pdf" | "img" | "xlsx" | "docx" }[];
  timeline: { date: string; title: string; subtitle: string; color: string }[];
}

const MOCK_EXPENSES: ExpenseDetail[] = [
  {
    id: "EXP-2026-089",
    projectName: "Montagem Lab de Robótica",
    projectId: "PRJ-2026-012",
    department: "Engenharia & Robótica",
    projectStatus: "Ativo",
    category: "Equipamentos",
    amount: 4500,
    budgetTotal: 50000,
    budgetSpent: 18750,
    description:
      "Aquisição de componentes avançados de braço robótico e sensores para o novo Laboratório de Robótica. Este equipamento é essencial para os projetos de pesquisa e programas de treinamento de alunos. O braço robótico será utilizado em tarefas de montagem de precisão e experimentos de automação com IA. Os componentes incluem servomotores, sensores de força, mecanismos de garra e placas de controle.",
    submittedAt: "24 Out 2026 às 14:45",
    submittedAgo: "há 3 dias",
    status: "Pending",
    submitter: {
      name: "Sarah Jenkins",
      role: "Coordenadora de Projeto",
      email: "sarah.jenkins@university.edu",
      phone: "+55 (11) 99123-4567",
      dept: "Depto. de Engenharia",
    },
    documents: [
      { name: "Nota_Fiscal_Componentes_Robo.pdf", size: "2.4 MB", date: "24 Out 2026", type: "pdf" },
      { name: "Comprovante_Pagamento.jpg", size: "1.8 MB", date: "24 Out 2026", type: "img" },
      { name: "Planilha_Orcamento.xlsx", size: "156 KB", date: "24 Out 2026", type: "xlsx" },
      { name: "Justificativa_Projeto.docx", size: "245 KB", date: "24 Out 2026", type: "docx" },
    ],
    timeline: [
      { date: "24 Out 2026 • 14:45", title: "Despesa Enviada", subtitle: "Por Sarah Jenkins", color: "bg-orange-400" },
      { date: "24 Out 2026 • 14:50", title: "Documentos Anexados", subtitle: "4 arquivos enviados", color: "bg-blue-400" },
      { date: "24 Out 2026 • 15:15", title: "Verificação de Orçamento", subtitle: "Checagem automática aprovada", color: "bg-purple-400" },
      { date: "27 Out 2026 • 10:30", title: "Aguardando Revisão", subtitle: "Atribuído ao Administrador", color: "bg-gray-300" },
    ],
  },
  {
    id: "EXP-2026-088",
    projectName: "Bolsa de Pesquisa em IA",
    projectId: "PRJ-2026-008",
    department: "Ciência da Computação",
    projectStatus: "Ativo",
    category: "Bolsa de Pesquisa",
    amount: 12050,
    budgetTotal: 100000,
    budgetSpent: 45000,
    description:
      "Alocação de recursos para bolsa de pesquisa em Inteligência Artificial, cobrindo infraestrutura computacional, licenciamento de conjuntos de dados e bolsas para assistentes de pesquisa durante o semestre.",
    submittedAt: "23 Out 2026 às 10:15",
    submittedAgo: "há 4 dias",
    status: "Approved",
    submitter: {
      name: "Dr. Alan Turing",
      role: "Docente",
      email: "alan.turing@university.edu",
      phone: "+55 (11) 99987-6543",
      dept: "Depto. de Ciência da Computação",
    },
    documents: [
      { name: "Proposta_Bolsa_Pesquisa.pdf", size: "3.1 MB", date: "23 Out 2026", type: "pdf" },
      { name: "Plano_Orcamentario.xlsx", size: "210 KB", date: "23 Out 2026", type: "xlsx" },
    ],
    timeline: [
      { date: "23 Out 2026 • 10:15", title: "Despesa Enviada", subtitle: "Por Dr. Alan Turing", color: "bg-orange-400" },
      { date: "23 Out 2026 • 11:00", title: "Documentos Anexados", subtitle: "2 arquivos enviados", color: "bg-blue-400" },
      { date: "25 Out 2026 • 09:00", title: "Aprovado", subtitle: "Pelo Administrador", color: "bg-green-400" },
    ],
  },
];

const ALL_IDS = MOCK_EXPENSES.map((e) => e.id);

function DocIcon({ type }: { type: ExpenseDetail["documents"][0]["type"] }) {
  if (type === "pdf")
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-red-500" fill="currentColor">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8.5 17.5h-1v-5h1v5zm3 0h-1v-3h1v3zm3 0h-1v-5h1v5z" />
        </svg>
      </div>
    );
  if (type === "img")
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-blue-500" fill="currentColor">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
        </svg>
      </div>
    );
  if (type === "xlsx")
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-green-600" fill="currentColor">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM7 15l2-3-2-3h1.5l1.25 2 1.25-2H12.5l-2 3 2 3H11l-1.25-2-1.25 2H7z" />
        </svg>
      </div>
    );
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50">
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-purple-500" fill="currentColor">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM9 13h6v1H9zm0 2h6v1H9zm0-4h3v1H9z" />
      </svg>
    </div>
  );
}

function StatusBanner({ status, submittedAt, submittedAgo }: { status: StatusType; submittedAt: string; submittedAgo: string }) {
  if (status === "Pending")
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
        <div className="text-right">
          <p className="text-xs font-semibold text-orange-500">Enviado</p>
          <p className="text-sm font-bold text-orange-800">{submittedAt}</p>
          <p className="text-xs text-orange-500">{submittedAgo}</p>
        </div>
      </div>
    );
  if (status === "Approved")
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
            <p className="text-sm text-green-600">Esta despesa foi aprovada com sucesso</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-green-500">Enviado</p>
          <p className="text-sm font-bold text-green-800">{submittedAt}</p>
          <p className="text-xs text-green-500">{submittedAgo}</p>
        </div>
      </div>
    );
  return (
    <div className="flex items-center justify-between rounded-xl border-l-4 border-red-500 bg-red-50 px-6 py-4 mb-5">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-500">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="h-5 w-5">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <p className="font-bold text-red-700">Rejeitado</p>
          <p className="text-sm text-red-600">Esta despesa foi rejeitada</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs font-semibold text-red-500">Enviado</p>
        <p className="text-sm font-bold text-red-800">{submittedAt}</p>
        <p className="text-xs text-red-500">{submittedAgo}</p>
      </div>
    </div>
  );
}

export default function ExpenseDetalhe() {
  const router = useRouter();
  const { id } = router.query;
  const [notes, setNotes] = useState("");
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [expenses, setExpenses] = useState<ExpenseDetail[]>(MOCK_EXPENSES);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") return;
    const token = localStorage.getItem("accessToken");
    if (!token) router.push("/login");
  }, [router]);

  const expense = expenses.find((e) => e.id === id) ?? expenses[0];
  const currentIndex = ALL_IDS.indexOf(expense.id);
  const total = ALL_IDS.length;

  function handleApprove() {
    setExpenses((prev) => prev.map((e) => e.id === expense.id ? { ...e, status: "Approved" as StatusType } : e));
  }

  function handleReject() {
    setExpenses((prev) => prev.map((e) => e.id === expense.id ? { ...e, status: "Rejected" as StatusType } : e));
  }

  function goTo(index: number) {
    router.push({ pathname: "/dashboard/admin/expenses/detail", query: { id: ALL_IDS[index] } });
  }

  const remaining = expense.budgetTotal - expense.budgetSpent;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <AdminSidebar active="expenses" />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard/admin/expenses")}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Detalhes da Despesa</h1>
              <p className="text-sm text-gray-500">
                {expense.id} • {expense.projectName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a1 1 0 001 1h8a1 1 0 001-1v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a1 1 0 00-1-1H6a1 1 0 00-1 1zm2 0h6v3H7V4zm-1 9v-1h8v1H6zm0 2h8v2H6v-2z" clipRule="evenodd" />
              </svg>
              Imprimir
            </button>
            <button className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
              </svg>
              Exportar PDF
            </button>
            {expense.status === "Pending" && (
              <>
                <button
                  onClick={handleApprove}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                  Aprovar
                </button>
                <button
                  onClick={handleReject}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition"
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
        <main className="flex-1 overflow-y-auto px-8 py-6">
          <StatusBanner status={expense.status} submittedAt={expense.submittedAt} submittedAgo={expense.submittedAgo} />

          <div className="grid grid-cols-3 gap-5">
            {/* Left — main content */}
            <div className="col-span-2 space-y-5">

              {/* Expense Overview */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-blue-500">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <h2 className="text-sm font-bold text-gray-800">Visão Geral da Despesa</h2>
                </div>

                <div className="grid grid-cols-2 gap-5 mb-5">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">ID da Despesa</p>
                    <p className="text-sm font-bold text-[#2563EB]">{expense.id}</p>
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Categoria</p>
                    <select className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-3 pr-8 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                      <option>Equipamentos</option>
                      <option>Viagem</option>
                      <option>Software</option>
                      <option>Bolsa de Pesquisa</option>
                      <option>Outro</option>
                    </select>
                  </div>
                </div>

                <div className="mb-5">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">Valor Solicitado</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ${expense.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="mb-6">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Descrição</p>
                  <p className="text-sm leading-relaxed text-gray-600">{expense.description}</p>
                </div>

                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Alocação do Orçamento</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                      <p className="text-xs font-medium text-blue-600">Orçamento do Projeto</p>
                      <p className="mt-1 text-xl font-bold text-blue-800">
                        ${expense.budgetTotal.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3">
                      <p className="text-xs font-medium text-green-600">Gasto até Agora</p>
                      <p className="mt-1 text-xl font-bold text-green-800">
                        ${expense.budgetSpent.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div className="rounded-xl border border-purple-100 bg-purple-50 px-4 py-3">
                      <p className="text-xs font-medium text-purple-600">Restante</p>
                      <p className="mt-1 text-xl font-bold text-purple-800">
                        ${remaining.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submitted Documents */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-blue-500">
                    <path fillRule="evenodd" d="M15.621 4.379a3 3 0 00-4.242 0l-7 7a3 3 0 004.241 4.243h.001l.497-.5a.75.75 0 011.064 1.057l-.498.501-.002.002a4.5 4.5 0 01-6.364-6.364l7-7a4.5 4.5 0 016.368 6.36l-3.455 3.553A2.625 2.625 0 119.52 9.52l3.45-3.451a.75.75 0 111.061 1.06l-3.45 3.451a1.125 1.125 0 001.587 1.595l3.454-3.553a3 3 0 000-4.242z" clipRule="evenodd" />
                  </svg>
                  <h2 className="text-sm font-bold text-gray-800">Documentos Enviados</h2>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                    {expense.documents.length} arquivos
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {expense.documents.map((doc) => (
                    <div key={doc.name} className="flex items-start gap-3 rounded-xl border border-gray-200 p-3 hover:border-blue-200 hover:bg-blue-50/30 transition">
                      <DocIcon type={doc.type} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-800">{doc.name}</p>
                        <p className="text-xs text-gray-400">{doc.size} • {doc.date}</p>
                        <div className="mt-1.5 flex gap-3">
                          <button className="text-xs font-semibold text-[#2563EB] hover:underline">Ver</button>
                          <button className="text-xs font-semibold text-[#2563EB] hover:underline">Baixar</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Review Notes */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-blue-500">
                    <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902.848.137 1.705.248 2.57.331v3.443a.75.75 0 001.28.53l3.58-3.579a.78.78 0 01.527-.224 41.202 41.202 0 005.183-.5c1.437-.232 2.43-1.49 2.43-2.903V5.426c0-1.413-.993-2.67-2.43-2.902A41.289 41.289 0 0010 2zm0 7a1 1 0 100-2 1 1 0 000 2zM6 9a1 1 0 11-2 0 1 1 0 012 0zm7 1a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  <h2 className="text-sm font-bold text-gray-800">Adicionar Notas de Revisão</h2>
                </div>

                <label className="mb-1.5 block text-sm font-medium text-gray-700">Notas / Comentários</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Adicione seus comentários de revisão, perguntas ou notas de aprovação aqui..."
                  rows={4}
                  className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />

                <div className="mt-3 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]"
                    />
                    <span className="text-sm text-gray-600">Notificar solicitante por e-mail</span>
                  </label>
                  <button className="flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8] transition">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                    </svg>
                    Salvar Notas
                  </button>
                </div>
              </div>
            </div>

            {/* Right — sidebar */}
            <div className="space-y-5">

              {/* Project Information */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-blue-500">
                    <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                    <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                  </svg>
                  <h3 className="text-sm font-bold text-gray-800">Informações do Projeto</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Nome do Projeto</p>
                    <p className="mt-0.5 text-sm font-semibold text-gray-800">{expense.projectName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">ID do Projeto</p>
                    <p className="mt-0.5 text-sm font-semibold text-[#2563EB]">{expense.projectId}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Departamento</p>
                    <p className="mt-0.5 text-sm font-semibold text-gray-800">{expense.department}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Status do Projeto</p>
                    <div className="mt-1">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${expense.projectStatus === "Ativo" ? "bg-green-50 text-green-700" : expense.projectStatus === "Pausado" ? "bg-orange-50 text-orange-700" : "bg-gray-100 text-gray-600"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${expense.projectStatus === "Ativo" ? "bg-green-500" : expense.projectStatus === "Pausado" ? "bg-orange-400" : "bg-gray-400"}`} />
                        {expense.projectStatus}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => router.push("/dashboard/admin/projects/detalhe")}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 text-sm font-medium text-[#2563EB] hover:bg-blue-50 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z" />
                    <path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 105.656 5.656l3-3a4 4 0 00-.225-5.865z" />
                  </svg>
                  Ver Detalhes do Projeto
                </button>
              </div>

              {/* Submitted By */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-blue-500">
                    <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                  </svg>
                  <h3 className="text-sm font-bold text-gray-800">Enviado Por</h3>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-lg font-bold text-white">
                    {expense.submitter.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{expense.submitter.name}</p>
                    <p className="text-sm text-gray-500">{expense.submitter.role}</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5 text-sm text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-gray-400">
                      <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                      <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
                    </svg>
                    {expense.submitter.email}
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-gray-400">
                      <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z" clipRule="evenodd" />
                    </svg>
                    {expense.submitter.phone}
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-gray-400">
                      <path fillRule="evenodd" d="M4 16.5v-13h-.25a.75.75 0 010-1.5h12.5a.75.75 0 010 1.5H16v13h.25a.75.75 0 010 1.5h-3.5a.75.75 0 01-.75-.75v-2.5a.75.75 0 00-.75-.75h-2.5a.75.75 0 00-.75.75v2.5a.75.75 0 01-.75.75h-3.5a.75.75 0 010-1.5H4zm3-11a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5A.75.75 0 017 5.75zm0 4a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5A.75.75 0 017 9.75zm5-4a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5a.75.75 0 01-.75-.75zm0 4a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                    </svg>
                    {expense.submitter.dept}
                  </div>
                </div>

                <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 text-sm font-medium text-[#2563EB] hover:bg-blue-50 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902.848.137 1.705.248 2.57.331v3.443a.75.75 0 001.28.53l3.58-3.579a.78.78 0 01.527-.224 41.202 41.202 0 005.183-.5c1.437-.232 2.43-1.49 2.43-2.903V5.426c0-1.413-.993-2.67-2.43-2.902A41.289 41.289 0 0010 2zm0 7a1 1 0 100-2 1 1 0 000 2zM6 9a1 1 0 11-2 0 1 1 0 012 0zm7 1a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  Enviar Mensagem
                </button>
              </div>

              {/* Activity Timeline */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-blue-500">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                  </svg>
                  <h3 className="text-sm font-bold text-gray-800">Linha do Tempo</h3>
                </div>

                <div className="relative space-y-4 pl-5">
                  <div className="absolute left-1.5 top-1 h-[calc(100%-8px)] w-px bg-gray-200" />
                  {expense.timeline.map((event, i) => (
                    <div key={i} className="relative">
                      <span className={`absolute -left-[18px] mt-0.5 h-3 w-3 rounded-full border-2 border-white ${event.color}`} />
                      <p className="text-xs text-gray-400">{event.date}</p>
                      <p className="text-sm font-semibold text-gray-800">{event.title}</p>
                      <p className="text-xs text-gray-500">{event.subtitle}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom pagination */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              disabled={currentIndex <= 0}
              onClick={() => goTo(currentIndex - 1)}
              className="rounded-full border border-gray-200 p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
              </svg>
            </button>
            <span className="rounded-2xl border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-700 shadow-sm">
              {currentIndex + 1} / {total}
            </span>
            <button
              disabled={currentIndex >= total - 1}
              onClick={() => goTo(currentIndex + 1)}
              className="rounded-full border border-gray-200 p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
