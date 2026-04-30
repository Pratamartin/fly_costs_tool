import { useEffect } from "react";
import { useRouter } from "next/router";
import AdminSidebar from "@/components/AdminSidebar";
type StatusType = "Pending" | "Approved" | "Rejected";

interface RecentExpense {
  id: string;
  project: string;
  submitter: string;
  avatarInitial: string;
  amount: number;
  date: string;
  status: StatusType;
}

const MONTHLY_DATA = [
  { month: "Set", value: 105000 },
  { month: "Out", value: 148000 },
  { month: "Nov", value: 172000 },
  { month: "Dez", value: 88000 },
  { month: "Jan", value: 208000 },
  { month: "Fev", value: 158000 },
  { month: "Mar", value: 133000 },
  { month: "Abr", value: 192000 },
  { month: "Mai", value: 258000 },
];

const CATEGORY_DATA = [
  { label: "Equipamentos", percentage: 45, color: "#1e40af" },
  { label: "Viagens", percentage: 25, color: "#14b8a6" },
  { label: "Software", percentage: 15, color: "#8b5cf6" },
  { label: "Bolsas de Pesquisa", percentage: 10, color: "#f97316" },
  { label: "Outros", percentage: 5, color: "#9ca3af" },
];

const RECENT_EXPENSES: RecentExpense[] = [
  { id: "EXP-2026-089", project: "Montagem Lab de Robótica", submitter: "Sarah Jenkins", avatarInitial: "S", amount: 4500, date: "24 Out, 2026", status: "Pending" },
  { id: "EXP-2026-088", project: "Bolsa Pesquisa em IA", submitter: "Dr. Alan Turing", avatarInitial: "A", amount: 12050, date: "23 Out, 2026", status: "Approved" },
  { id: "EXP-2026-087", project: "Simpósio Bio-Tecnologia", submitter: "Elena Batista", avatarInitial: "E", amount: 850, date: "22 Out, 2026", status: "Rejected" },
  { id: "EXP-2026-086", project: "Lab de Computação Quântica", submitter: "Dr. Marie Curie", avatarInitial: "M", amount: 28500, date: "21 Out, 2026", status: "Approved" },
  { id: "EXP-2026-085", project: "Conferência de Alunos 2026", submitter: "Carlos Lima", avatarInitial: "C", amount: 1200, date: "20 Out, 2026", status: "Pending" },
];

function StatusBadge({ status }: { status: StatusType }) {
  if (status === "Pending")
    return (
      <span className="inline-flex items-center rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-semibold text-yellow-700 ring-1 ring-inset ring-yellow-200">
        Pendente
      </span>
    );
  if (status === "Approved")
    return (
      <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-200">
        Aprovado
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200">
      Rejeitado
    </span>
  );
}

function Avatar({ initial }: { initial: string }) {
  const colors: Record<string, string> = {
    S: "bg-indigo-500",
    A: "bg-pink-500",
    E: "bg-emerald-500",
    M: "bg-amber-500",
    C: "bg-sky-500",
    D: "bg-violet-500",
  };
  return (
    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${colors[initial] ?? "bg-gray-500"} text-xs font-bold text-white`}>
      {initial}
    </div>
  );
}

function BarChart() {
  const maxValue = Math.max(...MONTHLY_DATA.map((d) => d.value));
  const chartH = 155;
  const barW = 32;
  const gap = 14;
  const startX = 50;
  const baseY = 175;

  return (
    <svg viewBox="0 0 490 205" className="w-full" style={{ maxHeight: 205 }}>
      {[0, 50000, 100000, 150000, 200000, 250000].map((v) => {
        const y = baseY - (v / maxValue) * chartH;
        return (
          <g key={v}>
            <line x1={startX} y1={y} x2={490} y2={y} stroke="#f3f4f6" strokeWidth="1" />
            <text x={startX - 6} y={y + 4} textAnchor="end" style={{ fontSize: 9, fill: "#9ca3af" }}>
              {v === 0 ? "$0" : `$${v / 1000}k`}
            </text>
          </g>
        );
      })}
      {MONTHLY_DATA.map((d, i) => {
        const barH = (d.value / maxValue) * chartH;
        const x = startX + i * (barW + gap);
        const y = baseY - barH;
        return (
          <g key={d.month}>
            <rect x={x} y={y} width={barW} height={barH} rx={4} fill="#2563EB" className="hover:opacity-80 cursor-pointer transition-opacity" />
            <text x={x + barW / 2} y={baseY + 15} textAnchor="middle" style={{ fontSize: 10, fill: "#6b7280" }}>
              {d.month}
            </text>
          </g>
        );
      })}
      <line x1={startX} y1={baseY} x2={490} y2={baseY} stroke="#e5e7eb" strokeWidth="1" />
    </svg>
  );
}

function DonutChart() {
  const cx = 90;
  const cy = 90;
  const r = 60;
  const C = 2 * Math.PI * r;
  let cumulativePercent = 0;

  const segments = CATEGORY_DATA.map((cat) => {
    const dash = (cat.percentage / 100) * C;
    const gap = C - dash;
    const offset = C - (cumulativePercent / 100) * C;
    cumulativePercent += cat.percentage;
    return { ...cat, dash, gap, offset };
  });

  return (
    <svg viewBox="0 0 180 180" className="w-44 h-44 shrink-0">
      {segments.map((seg) => (
        <circle
          key={seg.label}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={seg.color}
          strokeWidth={30}
          strokeDasharray={`${seg.dash} ${seg.gap}`}
          strokeDashoffset={seg.offset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      ))}
      <circle cx={cx} cy={cy} r={44} fill="white" />
    </svg>
  );
}


export default function DashboardAdmin() {
  const router = useRouter();

  useEffect(() => {
    if (process.env.NODE_ENV === "development") return;
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <AdminSidebar active="dashboard" />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Painel Global</h1>
            <p className="text-sm text-gray-500">Visão geral de todos os projetos e despesas acadêmicas</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Pesquisar projetos, despesas..."
                className="w-64 rounded-lg border border-gray-300 bg-gray-50 py-2 pl-9 pr-4 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#1e2d3d] focus:ring-1 focus:ring-[#1e2d3d]"
              />
            </div>

            {/* Notification bell */}
            <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path d="M4.214 3.227a.75.75 0 00-1.156-.956 8.97 8.97 0 00-1.856 3.826.75.75 0 001.466.316 7.47 7.47 0 011.546-3.186zm11.73-.956a.75.75 0 00-1.156.956 7.47 7.47 0 011.547 3.186.75.75 0 001.466-.316 8.97 8.97 0 00-1.857-3.826zM10 2a6 6 0 00-6 6v1.076l-1.647 2.74A.75.75 0 003 13h14a.75.75 0 00.647-1.184L16 9.076V8a6 6 0 00-6-6zM9 17.5a1.5 1.5 0 003 0H9z" />
              </svg>
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>

            {/* Invite Users */}
            <button className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M11 5a3 3 0 11-6 0 3 3 0 016 0zM2.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 018 18a9.953 9.953 0 01-5.385-1.572zM16.25 5.75a.75.75 0 00-1.5 0v2h-2a.75.75 0 000 1.5h2v2a.75.75 0 001.5 0v-2h2a.75.75 0 000-1.5h-2v-2z" />
              </svg>
              Convidar Usuários
            </button>

            {/* Create Project */}
            <button className="flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1d4ed8] transition">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
              Criar Projeto
            </button>
          </div>
        </header>

        {/* Scrollable area */}
        <main className="flex-1 overflow-y-auto px-8 py-6">

          {/* Stats cards */}
          <div className="mb-6 grid grid-cols-3 gap-4">
            {/* Total Academic Spend */}
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
              <div>
                <p className="text-sm text-gray-500">Total de Gastos Acadêmicos</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">$1.245.890</p>
                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                    <path fillRule="evenodd" d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-4.72 4.72a.75.75 0 01-1.06-1.061l5.25-5.25a.75.75 0 011.06 0l3.074 3.073a20.923 20.923 0 015.545-4.931l-3.042-.815a.75.75 0 01-.53-.918z" clipRule="evenodd" />
                  </svg>
                  12,5% vs. ano acadêmico anterior
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-blue-600">
                  <path d="M10.75 10.818v2.614A3.13 3.13 0 0011.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 00-1.138-.432zM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 00-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.627-.514.909 0 .184.058.39.33.615z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-1a.75.75 0 000 1.5h1v.75a.75.75 0 001.5 0v-.75h1a.75.75 0 000-1.5h-1v-2.5z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* Global Remaining Budget */}
            <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">Orçamento Global Restante</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">$3.754.110</p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-green-600">
                    <path fillRule="evenodd" d="M1 2.75A.75.75 0 011.75 2h16.5a.75.75 0 010 1.5H18v8.75A2.75 2.75 0 0115.25 15h-1.072l.798 3.06a.75.75 0 01-1.452.38L13.41 18H6.59l-.114.44a.75.75 0 01-1.452-.38L5.823 15H4.75A2.75 2.75 0 012 12.25V3.5h-.25A.75.75 0 011 2.75zM7.373 15l-.391 1.5h6.037l-.392-1.5H7.373zM13.25 5a.75.75 0 01.75.75v5.5a.75.75 0 01-1.5 0v-5.5a.75.75 0 01.75-.75zm-3 1.75a.75.75 0 011.5 0v3.75a.75.75 0 01-1.5 0V6.75zm-3 2a.75.75 0 011.5 0v1.75a.75.75 0 01-1.5 0V8.75z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="mt-3">
                <div className="mb-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className="h-2 rounded-full bg-green-500" style={{ width: "24.9%" }} />
                </div>
                <p className="text-xs text-gray-400">24,9% do total de $5M alocado utilizado</p>
              </div>
            </div>

            {/* Pending Requests */}
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
              <div>
                <p className="text-sm text-gray-500">Solicitações Pendentes</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">142</p>
                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-orange-500">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  Atenção Necessária · Em 12 projetos ativos
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-orange-500">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* Charts row */}
          <div className="mb-6 grid grid-cols-5 gap-4">
            {/* Bar chart */}
            <div className="col-span-3 rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-800">Despesas Mensais</h2>
                <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition">
                  2026-2027
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <BarChart />
            </div>

            {/* Donut chart */}
            <div className="col-span-2 rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-800">Despesas por Categoria</h2>
                <button className="text-xs font-medium text-[#2563EB] hover:underline">Ver Relatório</button>
              </div>
              <div className="flex items-center gap-4">
                <DonutChart />
                <div className="space-y-2.5">
                  {CATEGORY_DATA.map((cat) => (
                    <div key={cat.label} className="flex items-center gap-2">
                      <div className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: cat.color }} />
                      <span className="text-xs text-gray-600">{cat.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Global Activity */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-800">Atividade Global Recente</h2>
                <p className="text-xs text-gray-400">Últimas despesas em todos os projetos</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                    <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z" clipRule="evenodd" />
                  </svg>
                  Filtrar
                </button>
                <button className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                    <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                    <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                  </svg>
                  Exportar
                </button>
              </div>
            </div>

            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">ID Despesa</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Projeto</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Solicitante</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {RECENT_EXPENSES.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <button className="text-sm font-semibold text-[#2563EB] hover:underline">
                        {expense.id}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{expense.project}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Avatar initial={expense.avatarInitial} />
                        <span className="text-sm text-gray-700">{expense.submitter}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                      ${expense.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{expense.date}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={expense.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end">
                        <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                            <path d="M3 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM8.5 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM15.5 8.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-gray-100 px-6 py-4">
              <p className="text-sm text-gray-400">
                Exibindo {RECENT_EXPENSES.length} de 142 solicitações
              </p>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
