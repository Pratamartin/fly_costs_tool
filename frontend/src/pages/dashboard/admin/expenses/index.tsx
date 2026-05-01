import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminSidebar from "@/components/AdminSidebar";

type StatusType = "Pending" | "Approved" | "Rejected";
type CategoryType = "Equipment" | "Travel" | "Software" | "Research Grant" | "Other";
type ViewMode = "table" | "grid";

interface ExpenseRequest {
  id: string;
  projectName: string;
  projectId: string;
  submitter: string;
  submitterRole: string;
  avatarInitial: string;
  category: CategoryType;
  amount: number;
  date: string;
  time: string;
  status: StatusType;
}

const MOCK_EXPENSES: ExpenseRequest[] = [
  { id: "EXP-2026-089", projectName: "Montagem Lab de Robótica", projectId: "PRJ-2026-012", submitter: "Sarah Jenkins", submitterRole: "Coordenadora", avatarInitial: "S", category: "Equipment", amount: 4500, date: "24 Out, 2026", time: "14:45", status: "Pending" },
  { id: "EXP-2026-088", projectName: "Bolsa Pesquisa em IA", projectId: "PRJ-2026-008", submitter: "Dr. Alan Turing", submitterRole: "Docente", avatarInitial: "A", category: "Research Grant", amount: 12050, date: "23 Out, 2026", time: "10:15", status: "Approved" },
  { id: "EXP-2026-087", projectName: "Simpósio Bio-Tecnologia", projectId: "PRJ-2026-015", submitter: "Elena Batista", submitterRole: "Coordenadora", avatarInitial: "E", category: "Travel", amount: 850, date: "22 Out, 2026", time: "16:30", status: "Rejected" },
  { id: "EXP-2026-086", projectName: "Infraestrutura em Nuvem", projectId: "PRJ-2026-021", submitter: "Michael Chen", submitterRole: "Equipe de TI", avatarInitial: "M", category: "Software", amount: 3200, date: "21 Out, 2026", time: "09:20", status: "Approved" },
  { id: "EXP-2026-085", projectName: "Bolsa Viagem Aluno", projectId: "PRJ-2026-019", submitter: "Jessica Park", submitterRole: "Aluna", avatarInitial: "J", category: "Travel", amount: 1150, date: "20 Out, 2026", time: "15:10", status: "Pending" },
  { id: "EXP-2026-084", projectName: "Lab de Computação Quântica", projectId: "PRJ-2026-003", submitter: "Dr. Marie Curie", submitterRole: "Pesquisadora", avatarInitial: "M", category: "Equipment", amount: 28500, date: "19 Out, 2026", time: "11:00", status: "Approved" },
  { id: "EXP-2026-083", projectName: "Conferência de Alunos 2026", projectId: "PRJ-2026-009", submitter: "Carlos Lima", submitterRole: "Aluno", avatarInitial: "C", category: "Travel", amount: 1200, date: "18 Out, 2026", time: "08:45", status: "Pending" },
  { id: "EXP-2026-082", projectName: "Desenvolvimento de Software", projectId: "PRJ-2026-007", submitter: "Priya Sharma", submitterRole: "Desenvolvedora", avatarInitial: "P", category: "Software", amount: 5400, date: "17 Out, 2026", time: "13:30", status: "Rejected" },
  { id: "EXP-2026-081", projectName: "Equipamentos de Neurociência", projectId: "PRJ-2026-011", submitter: "Dr. Oliver Reed", submitterRole: "Pesquisador", avatarInitial: "O", category: "Equipment", amount: 18750, date: "16 Out, 2026", time: "10:00", status: "Approved" },
  { id: "EXP-2026-080", projectName: "Workshop de Inovação", projectId: "PRJ-2026-004", submitter: "Aiko Yamamoto", submitterRole: "Coordenadora", avatarInitial: "A", category: "Other", amount: 620, date: "15 Out, 2026", time: "09:15", status: "Pending" },
];

const AVATAR_COLORS: Record<string, string> = {
  S: "bg-indigo-500", A: "bg-pink-500", E: "bg-emerald-500",
  M: "bg-amber-500", C: "bg-sky-500", J: "bg-violet-500",
  P: "bg-rose-500", O: "bg-teal-500",
};

const CATEGORY_STYLES: Record<CategoryType, { bg: string; text: string; dot: string }> = {
  Equipment:      { bg: "bg-purple-50",  text: "text-purple-700",  dot: "bg-purple-400" },
  Travel:         { bg: "bg-teal-50",    text: "text-teal-700",    dot: "bg-teal-400" },
  Software:       { bg: "bg-indigo-50",  text: "text-indigo-700",  dot: "bg-indigo-400" },
  "Research Grant": { bg: "bg-blue-50",  text: "text-blue-700",    dot: "bg-blue-400" },
  Other:          { bg: "bg-gray-100",   text: "text-gray-600",    dot: "bg-gray-400" },
};

const CATEGORY_LABELS: Record<CategoryType, string> = {
  Equipment: "Equipamentos",
  Travel: "Viagem",
  Software: "Software",
  "Research Grant": "Bolsa de Pesq.",
  Other: "Outro",
};

function Avatar({ initial }: { initial: string }) {
  return (
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${AVATAR_COLORS[initial] ?? "bg-gray-500"} text-xs font-bold text-white`}>
      {initial}
    </div>
  );
}

function StatusBadge({ status }: { status: StatusType }) {
  if (status === "Pending")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-semibold text-yellow-700 ring-1 ring-inset ring-yellow-200">
        <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
        Pendente
      </span>
    );
  if (status === "Approved")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-200">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        Aprovado
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      Rejeitado
    </span>
  );
}

function CategoryBadge({ category }: { category: CategoryType }) {
  const style = CATEGORY_STYLES[category];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${style.bg} ${style.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {CATEGORY_LABELS[category]}
    </span>
  );
}

interface ModalDetalheAdminProps {
  expense: ExpenseRequest;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

function ModalDetalheAdmin({ expense, onClose, onApprove, onReject }: ModalDetalheAdminProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{expense.id}</p>
            <h2 className="mt-0.5 text-lg font-bold text-gray-900">{expense.projectName}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center justify-between">
            <StatusBadge status={expense.status} />
            <p className="text-2xl font-bold text-gray-900">
              ${expense.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-400">Projeto</p>
              <p className="mt-0.5 text-sm font-semibold text-gray-800">{expense.projectName}</p>
              <p className="text-xs text-gray-400">{expense.projectId}</p>
            </div>
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-400">Categoria</p>
              <div className="mt-1"><CategoryBadge category={expense.category} /></div>
            </div>
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-400">Solicitante</p>
              <div className="mt-1.5 flex items-center gap-2">
                <Avatar initial={expense.avatarInitial} />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{expense.submitter}</p>
                  <p className="text-xs text-gray-400">{expense.submitterRole}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-400">Data</p>
              <p className="mt-0.5 text-sm font-semibold text-gray-800">{expense.date}</p>
              <p className="text-xs text-gray-400">{expense.time}</p>
            </div>
          </div>
        </div>

        {expense.status === "Pending" && (
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
            <button
              onClick={() => { onReject(expense.id); onClose(); }}
              className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
              Rejeitar
            </button>
            <button
              onClick={() => { onApprove(expense.id); onClose(); }}
              className="flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8] transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
              Aprovar
            </button>
          </div>
        )}
        {expense.status !== "Pending" && (
          <div className="flex justify-end border-t border-gray-100 px-6 py-4">
            <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminExpenses() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<ExpenseRequest[]>(MOCK_EXPENSES);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterProject, setFilterProject] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterDate, setFilterDate] = useState("30d");
  const [filterAmount, setFilterAmount] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [detailExpense, setDetailExpense] = useState<ExpenseRequest | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 8;

  useEffect(() => {
    if (process.env.NODE_ENV === "development") return;
    const token = localStorage.getItem("accessToken");
    if (!token) router.push("/login");
  }, [router]);

  function handleApprove(id: string) {
    setExpenses((prev) => prev.map((e) => e.id === id ? { ...e, status: "Approved" as StatusType } : e));
  }

  function handleReject(id: string) {
    setExpenses((prev) => prev.map((e) => e.id === id ? { ...e, status: "Rejected" as StatusType } : e));
  }

  function handleSelectAll(checked: boolean) {
    if (checked) setSelected(new Set(filtered.map((e) => e.id)));
    else setSelected(new Set());
  }

  function handleSelectOne(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  function handleReset() {
    setFilterStatus("all");
    setFilterProject("all");
    setFilterCategory("all");
    setFilterDate("30d");
    setFilterAmount("all");
    setSearch("");
  }

  const filtered = expenses.filter((e) => {
    if (filterStatus !== "all" && e.status.toLowerCase() !== filterStatus) return false;
    if (filterCategory !== "all" && e.category !== filterCategory) return false;
    if (search && !e.id.toLowerCase().includes(search.toLowerCase()) &&
      !e.projectName.toLowerCase().includes(search.toLowerCase()) &&
      !e.submitter.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const totalExpenses = expenses.length;
  const pendingCount = expenses.filter((e) => e.status === "Pending").length;
  const approvedCount = expenses.filter((e) => e.status === "Approved").length;
  const rejectedCount = expenses.filter((e) => e.status === "Rejected").length;

  const projects = Array.from(new Set(expenses.map((e) => e.projectName)));

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <AdminSidebar active="expenses" />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Solicitações de Despesas</h1>
            <p className="text-sm text-gray-500">Gerencie e revise todas as solicitações de despesas dos projetos</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                </svg>
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Pesquisar despesas..."
                className="w-56 rounded-lg border border-gray-300 bg-gray-50 py-2 pl-9 pr-4 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#1e2d3d] focus:ring-1 focus:ring-[#1e2d3d]"
              />
            </div>

            <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path d="M4.214 3.227a.75.75 0 00-1.156-.956 8.97 8.97 0 00-1.856 3.826.75.75 0 001.466.316 7.47 7.47 0 011.546-3.186zm11.73-.956a.75.75 0 00-1.156.956 7.47 7.47 0 011.547 3.186.75.75 0 001.466-.316 8.97 8.97 0 00-1.857-3.826zM10 2a6 6 0 00-6 6v1.076l-1.647 2.74A.75.75 0 003 13h14a.75.75 0 00.647-1.184L16 9.076V8a6 6 0 00-6-6zM9 17.5a1.5 1.5 0 003 0H9z" />
              </svg>
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>

            <button className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
              </svg>
              Exportar Relatório
            </button>

            <button className="flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1d4ed8] transition">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z" clipRule="evenodd" />
              </svg>
              Filtros Avançados
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
          {/* Stats cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-blue-600">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-blue-500">Todos</span>
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900">{totalExpenses.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Total de Despesas</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-orange-500">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-orange-500">Urgente</span>
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900">{pendingCount}</p>
              <p className="text-sm text-gray-500">Aguardando Revisão</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-green-600">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-green-600">Este Mês</span>
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900">{approvedCount.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Aprovadas</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-red-500">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-red-500">Este Mês</span>
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900">{rejectedCount}</p>
              <p className="text-sm text-gray-500">Rejeitadas</p>
            </div>
          </div>

          {/* Filter & Sort */}
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-800">Filtrar e Ordenar</h2>
              <button onClick={handleReset} className="text-sm font-medium text-[#2563EB] hover:underline">
                Limpar Filtros
              </button>
            </div>
            <div className="grid grid-cols-5 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-700 outline-none focus:border-[#1e2d3d] focus:ring-1 focus:ring-[#1e2d3d]"
                >
                  <option value="all">Todos os Status</option>
                  <option value="pending">Pendente</option>
                  <option value="approved">Aprovado</option>
                  <option value="rejected">Rejeitado</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Projeto</label>
                <select
                  value={filterProject}
                  onChange={(e) => { setFilterProject(e.target.value); setCurrentPage(1); }}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-700 outline-none focus:border-[#1e2d3d] focus:ring-1 focus:ring-[#1e2d3d]"
                >
                  <option value="all">Todos os Projetos</option>
                  {projects.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Categoria</label>
                <select
                  value={filterCategory}
                  onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-700 outline-none focus:border-[#1e2d3d] focus:ring-1 focus:ring-[#1e2d3d]"
                >
                  <option value="all">Todas as Categorias</option>
                  <option value="Equipment">Equipamentos</option>
                  <option value="Travel">Viagem</option>
                  <option value="Software">Software</option>
                  <option value="Research Grant">Bolsa de Pesquisa</option>
                  <option value="Other">Outro</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Período</label>
                <select
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-700 outline-none focus:border-[#1e2d3d] focus:ring-1 focus:ring-[#1e2d3d]"
                >
                  <option value="7d">Últimos 7 Dias</option>
                  <option value="30d">Últimos 30 Dias</option>
                  <option value="90d">Últimos 90 Dias</option>
                  <option value="1y">Último Ano</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Valor</label>
                <select
                  value={filterAmount}
                  onChange={(e) => setFilterAmount(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-700 outline-none focus:border-[#1e2d3d] focus:ring-1 focus:ring-[#1e2d3d]"
                >
                  <option value="all">Qualquer Valor</option>
                  <option value="0-1000">$0 – $1.000</option>
                  <option value="1000-5000">$1.000 – $5.000</option>
                  <option value="5000-20000">$5.000 – $20.000</option>
                  <option value="20000+">$20.000+</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-800">Solicitações de Despesas</h2>
                <p className="text-xs text-gray-400">Exibindo {filtered.length} despesas no total</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Ordenar por:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="rounded-lg border border-gray-300 bg-white py-1.5 pl-3 pr-7 text-xs text-gray-700 outline-none focus:border-[#1e2d3d] focus:ring-1 focus:ring-[#1e2d3d]"
                  >
                    <option value="recent">Mais Recente</option>
                    <option value="amount-desc">Maior Valor</option>
                    <option value="amount-asc">Menor Valor</option>
                    <option value="status">Status</option>
                  </select>
                </div>

                {/* View toggle */}
                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setViewMode("table")}
                    className={`p-1.5 transition ${viewMode === "table" ? "bg-[#2563EB] text-white" : "text-gray-400 hover:bg-gray-50"}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M.99 5.24A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25l.01 9.5A2.25 2.25 0 0116.76 17H3.26A2.272 2.272 0 011 14.75l-.01-9.51zM2.5 9v5.25c0 .414.336.75.75.75H7V9H2.5zm4.5 0v6H17V9H7zm0-2.5v2H17V6.5H7zm-4.5 0v2H7v-2H2.5z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 transition ${viewMode === "grid" ? "bg-[#2563EB] text-white" : "text-gray-400 hover:bg-gray-50"}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v2.5A2.25 2.25 0 004.25 9h2.5A2.25 2.25 0 009 6.75v-2.5A2.25 2.25 0 006.75 2h-2.5zm0 9A2.25 2.25 0 002 13.25v2.5A2.25 2.25 0 004.25 18h2.5A2.25 2.25 0 009 15.75v-2.5A2.25 2.25 0 006.75 11h-2.5zm6.5-9A2.25 2.25 0 008.5 4.25v2.5A2.25 2.25 0 0010.75 9h2.5A2.25 2.25 0 0015.5 6.75v-2.5A2.25 2.25 0 0013.25 2h-2.5zm0 9a2.25 2.25 0 00-2.25 2.25v2.5A2.25 2.25 0 0010.75 18h2.5a2.25 2.25 0 002.25-2.25v-2.5A2.25 2.25 0 0013.25 11h-2.5z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {viewMode === "table" ? (
              <>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selected.size === paginated.length && paginated.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Projeto</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Solicitante</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Categoria</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Valor</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Data</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-16 text-center text-sm text-gray-400">
                          Nenhuma despesa encontrada com os filtros aplicados.
                        </td>
                      </tr>
                    ) : paginated.map((expense) => (
                      <tr key={expense.id} className={`hover:bg-gray-50 transition-colors ${selected.has(expense.id) ? "bg-blue-50/40" : ""}`}>
                        <td className="px-6 py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(expense.id)}
                            onChange={(e) => handleSelectOne(expense.id, e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setDetailExpense(expense)}
                            className="text-sm font-semibold text-[#2563EB] hover:underline whitespace-nowrap"
                          >
                            {expense.id}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-800">{expense.projectName}</p>
                          <p className="text-xs text-gray-400">{expense.projectId}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar initial={expense.avatarInitial} />
                            <div>
                              <p className="text-sm font-medium text-gray-800">{expense.submitter}</p>
                              <p className="text-xs text-gray-400">{expense.submitterRole}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <CategoryBadge category={expense.category} />
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900 whitespace-nowrap">
                          ${expense.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-sm text-gray-700">{expense.date}</p>
                          <p className="text-xs text-gray-400">{expense.time}</p>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={expense.status} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setDetailExpense(expense)}
                              title="Ver detalhes"
                              className="rounded-lg p-1.5 text-blue-400 hover:bg-blue-50 hover:text-blue-600 transition"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                                <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41z" clipRule="evenodd" />
                              </svg>
                            </button>
                            {expense.status === "Pending" && (
                              <>
                                <button
                                  onClick={() => handleApprove(expense.id)}
                                  title="Aprovar"
                                  className="rounded-lg p-1.5 text-green-400 hover:bg-green-50 hover:text-green-600 transition"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleReject(expense.id)}
                                  title="Rejeitar"
                                  className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 transition"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                  </svg>
                                </button>
                              </>
                            )}
                            {expense.status !== "Pending" && (
                              <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                  <path d="M3 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM8.5 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM15.5 8.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
                  <p className="text-sm text-gray-400">
                    Exibindo {Math.min((currentPage - 1) * perPage + 1, filtered.length)}–{Math.min(currentPage * perPage, filtered.length)} de {filtered.length} resultados
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                      className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <span className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700">
                      {currentPage} / {totalPages || 1}
                    </span>
                    <button
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                      className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Grid view */
              <div className="p-6">
                {paginated.length === 0 ? (
                  <p className="py-16 text-center text-sm text-gray-400">Nenhuma despesa encontrada com os filtros aplicados.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
                    {paginated.map((expense) => (
                      <div key={expense.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <button
                            onClick={() => setDetailExpense(expense)}
                            className="text-sm font-semibold text-[#2563EB] hover:underline"
                          >
                            {expense.id}
                          </button>
                          <StatusBadge status={expense.status} />
                        </div>
                        <p className="text-sm font-semibold text-gray-900 mb-0.5">{expense.projectName}</p>
                        <p className="text-xs text-gray-400 mb-3">{expense.projectId}</p>
                        <div className="flex items-center justify-between mb-3">
                          <CategoryBadge category={expense.category} />
                          <p className="text-base font-bold text-gray-900">
                            ${expense.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                          <div className="flex items-center gap-2">
                            <Avatar initial={expense.avatarInitial} />
                            <div>
                              <p className="text-xs font-medium text-gray-700">{expense.submitter}</p>
                              <p className="text-xs text-gray-400">{expense.submitterRole}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => setDetailExpense(expense)} className="rounded-lg p-1 text-blue-400 hover:bg-blue-50 transition">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                                <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41z" clipRule="evenodd" />
                              </svg>
                            </button>
                            {expense.status === "Pending" && (
                              <>
                                <button onClick={() => handleApprove(expense.id)} className="rounded-lg p-1 text-green-400 hover:bg-green-50 transition">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                  </svg>
                                </button>
                                <button onClick={() => handleReject(expense.id)} className="rounded-lg p-1 text-red-400 hover:bg-red-50 transition">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                  <p className="text-sm text-gray-400">
                    Exibindo {Math.min((currentPage - 1) * perPage + 1, filtered.length)}–{Math.min(currentPage * perPage, filtered.length)} de {filtered.length} resultados
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                      className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <span className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700">
                      {currentPage} / {totalPages || 1}
                    </span>
                    <button
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                      className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {detailExpense && (
        <ModalDetalheAdmin
          expense={detailExpense}
          onClose={() => setDetailExpense(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}
