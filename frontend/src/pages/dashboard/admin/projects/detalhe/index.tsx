import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminSidebar from "@/components/AdminSidebar";

type TabType = "overview" | "expenses" | "team";
type StatusType = "Pendente" | "Aprovado" | "Rejeitado";

interface ActivityItem {
  id: string;
  item: string;
  category: string;
  submittedBy: string;
  submitterInitial: string;
  date: string;
  amount: number;
  status: StatusType;
}

const CHART_DATA = [
  { month: "Set", diarias: 4300, passagens: 3100, servicos: 4100 },
  { month: "Out", diarias: 5100, passagens: 4800, servicos: 4900 },
  { month: "Nov", diarias: 3900, passagens: 2100, servicos: 2200 },
  { month: "Dez", diarias: 6300, passagens: 6700, servicos: 8100 },
  { month: "Jan", diarias: 4100, passagens: 3500, servicos: 2300 },
  { month: "Fev", diarias: 5800, passagens: 6000, servicos: 5900 },
];

const CHART_SERIES = [
  { key: "diarias" as const, label: "Diárias", color: "#1e40af" },
  { key: "passagens" as const, label: "Passagens", color: "#8b5cf6" },
  { key: "servicos" as const, label: "Serviços de Terceiros", color: "#10b981" },
];

const RECENT_ACTIVITY: ActivityItem[] = [
  { id: "1", item: "Arduino Mega Kits (x10)", category: "Hardware Supplies", submittedBy: "Carlos Lima", submitterInitial: "C", date: "24 Out, 2026", amount: 450, status: "Pendente" },
  { id: "2", item: "Solda Elétrica Premium", category: "Ferramentas", submittedBy: "Ana Beatriz", submitterInitial: "A", date: "22 Out, 2026", amount: 180, status: "Aprovado" },
  { id: "3", item: "Componentes Eletrônicos", category: "Material de Lab", submittedBy: "Pedro Costa", submitterInitial: "P", date: "20 Out, 2026", amount: 890, status: "Aprovado" },
  { id: "4", item: "Cabos e Conectores USB-C", category: "Hardware Supplies", submittedBy: "Maria Santos", submitterInitial: "M", date: "18 Out, 2026", amount: 245, status: "Pendente" },
  { id: "5", item: "Kit Sensores Ultrassônicos", category: "Material de Lab", submittedBy: "Carlos Lima", submitterInitial: "C", date: "15 Out, 2026", amount: 630, status: "Aprovado" },
];

function StatusBadge({ status }: { status: StatusType }) {
  const styles: Record<StatusType, string> = {
    Pendente: "bg-yellow-50 text-yellow-700 ring-yellow-200",
    Aprovado: "bg-green-50 text-green-700 ring-green-200",
    Rejeitado: "bg-red-50 text-red-700 ring-red-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}>
      {status}
    </span>
  );
}

function Avatar({ initial }: { initial: string }) {
  const colors: Record<string, string> = {
    C: "bg-sky-500", A: "bg-pink-500", P: "bg-violet-500",
    M: "bg-amber-500", S: "bg-indigo-500", E: "bg-emerald-500",
  };
  return (
    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${colors[initial] ?? "bg-gray-500"} text-xs font-bold text-white`}>
      {initial}
    </div>
  );
}

function CategoryIcon({ category }: { category: string }) {
  const isHardware = category.toLowerCase().includes("hardware") || category.toLowerCase().includes("lab");
  return (
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isHardware ? "bg-blue-50" : "bg-purple-50"}`}>
      {isHardware ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-blue-600">
          <path fillRule="evenodd" d="M14.5 10a4.5 4.5 0 004.284-5.882c-.105-.324-.51-.391-.752-.15L15.34 6.66a.454.454 0 01-.493.11 3.01 3.01 0 01-1.618-1.616.455.455 0 01.11-.494l2.694-2.692c.24-.241.174-.647-.15-.752a4.5 4.5 0 00-5.873 4.575c.055.873-.128 1.808-.8 2.368l-7.23 6.024a2.724 2.724 0 103.837 3.837l6.024-7.23c.56-.672 1.495-.855 2.368-.8.096.007.193.01.291.01zM5 16a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-purple-600">
          <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0-6a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" clipRule="evenodd" />
        </svg>
      )}
    </div>
  );
}

function GroupedBarChart() {
  const maxValue = 9000;
  const chartH = 165;
  const baseY = 192;
  const barW = 22;
  const barGap = 4;
  const groupGap = 36;
  const groupW = barW * 3 + barGap * 2;
  const startX = 55;

  return (
    <svg viewBox="0 0 680 215" className="w-full" style={{ maxHeight: 215 }}>
      {[0, 2000, 4000, 6000, 8000].map((v) => {
        const y = baseY - (v / maxValue) * chartH;
        return (
          <g key={v}>
            <line x1={startX} y1={y} x2={678} y2={y} stroke="#f3f4f6" strokeWidth="1" />
            <text x={startX - 6} y={y + 4} textAnchor="end" style={{ fontSize: 9, fill: "#9ca3af" }}>
              {v === 0 ? "0" : `${v / 1000}k`}
            </text>
          </g>
        );
      })}
      {CHART_DATA.map((d, gi) => {
        const groupX = startX + gi * (groupW + groupGap);
        return (
          <g key={d.month}>
            {CHART_SERIES.map((series, bi) => {
              const value = d[series.key];
              const barH = Math.max((value / maxValue) * chartH, 2);
              const x = groupX + bi * (barW + barGap);
              const y = baseY - barH;
              return (
                <rect key={series.key} x={x} y={y} width={barW} height={barH} rx={3} fill={series.color}
                  className="hover:opacity-80 cursor-pointer transition-opacity" />
              );
            })}
            <text x={groupX + groupW / 2} y={baseY + 15} textAnchor="middle" style={{ fontSize: 10, fill: "#6b7280" }}>
              {d.month}
            </text>
          </g>
        );
      })}
      <line x1={startX} y1={baseY} x2={678} y2={baseY} stroke="#e5e7eb" strokeWidth="1" />
    </svg>
  );
}


export default function DashboardAdminProjectDetalhe() {
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState<TabType>("overview");

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) router.push("/login");
  }, [router]);

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: "overview", label: "Visão Geral" },
    { id: "expenses", label: "Despesas", count: 12 },
    { id: "team", label: "Membros da Equipe", count: 5 },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <AdminSidebar active="projects" />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="border-b border-gray-200 bg-white">
          <div className="px-8 pt-4 pb-0">
            <div className="mb-3 flex items-center gap-1.5 text-xs text-gray-500">
              <button onClick={() => router.push("/dashboard/admin/projects")} className="hover:text-gray-800 hover:underline">
                Projetos
              </button>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-gray-300">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
              <span className="font-medium text-gray-700">Laboratório de Robótica 2026</span>
            </div>
            <div className="flex items-center justify-between pb-4">
              <div className="flex items-center gap-3">
                <button onClick={() => router.push("/dashboard/admin/projects")} className="flex items-center justify-center rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" /></svg>
                </button>
                <h1 className="text-xl font-bold text-gray-900">Laboratório de Robótica 2026</h1>
                <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-200">Ativo</span>
              </div>
              <div className="flex items-center gap-3">
                <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path d="M4.214 3.227a.75.75 0 00-1.156-.956 8.97 8.97 0 00-1.856 3.826.75.75 0 001.466.316 7.47 7.47 0 011.546-3.186zm11.73-.956a.75.75 0 00-1.156.956 7.47 7.47 0 011.547 3.186.75.75 0 001.466-.316 8.97 8.97 0 00-1.857-3.826zM10 2a6 6 0 00-6 6v1.076l-1.647 2.74A.75.75 0 003 13h14a.75.75 0 00.647-1.184L16 9.076V8a6 6 0 00-6-6zM9 17.5a1.5 1.5 0 003 0H9z" /></svg>
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
                </button>
                <button className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>
                  Editar Projeto
                </button>
                <button className="flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1d4ed8] transition">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path d="M11 5a3 3 0 11-6 0 3 3 0 016 0zM2.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 018 18a9.953 9.953 0 01-5.385-1.572zM16.25 5.75a.75.75 0 00-1.5 0v2h-2a.75.75 0 000 1.5h2v2a.75.75 0 001.5 0v-2h2a.75.75 0 000-1.5h-2v-2z" /></svg>
                  Adicionar Membro
                </button>
              </div>
            </div>
            <nav className="flex gap-0 -mb-px">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setAbaAtiva(tab.id)}
                  className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${abaAtiva === tab.id ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"}`}>
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${abaAtiva === tab.id ? "bg-blue-50 text-[#2563EB]" : "bg-gray-100 text-gray-500"}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-6">
          {abaAtiva === "overview" && (
            <>
              <div className="mb-6 grid grid-cols-3 gap-4">
                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
                  <div>
                    <p className="text-sm text-gray-500">Orçamento Total</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">$150.000<span className="text-base font-normal text-gray-400">,00</span></p>
                    <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-green-600">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5"><path fillRule="evenodd" d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-4.72 4.72a.75.75 0 01-1.06-1.061l5.25-5.25a.75.75 0 011.06 0l3.074 3.073a20.923 20.923 0 015.545-4.931l-3.042-.815a.75.75 0 01-.53-.918z" clipRule="evenodd" /></svg>
                      12% vs semestre anterior
                    </p>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-blue-600"><path fillRule="evenodd" d="M1 2.75A.75.75 0 011.75 2h16.5a.75.75 0 010 1.5H18v8.75A2.75 2.75 0 0115.25 15h-1.072l.798 3.06a.75.75 0 01-1.452.38L13.41 18H6.59l-.114.44a.75.75 0 01-1.452-.38L5.823 15H4.75A2.75 2.75 0 012 12.25V3.5h-.25A.75.75 0 011 2.75z" clipRule="evenodd" /></svg>
                  </div>
                </div>
                <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Gasto</p>
                      <p className="mt-1 text-2xl font-bold text-gray-900">$45.250<span className="text-base font-normal text-gray-400">,50</span></p>
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-purple-600"><path d="M10.75 10.818v2.614A3.13 3.13 0 0011.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 00-1.138-.432zM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 00-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.627-.514.909 0 .184.058.39.33.615z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-1a.75.75 0 000 1.5h1v.75a.75.75 0 001.5 0v-.75h1a.75.75 0 000-1.5h-1v-2.5z" clipRule="evenodd" /></svg>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="mb-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div className="h-2 rounded-full bg-purple-500" style={{ width: "30%" }} />
                    </div>
                    <p className="text-xs text-gray-400">30% do orçamento utilizado</p>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
                  <div>
                    <p className="text-sm text-gray-500">Solicitações Pendentes</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">8</p>
                    <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-orange-500">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                      $12.400,00 aguardando aprovação
                    </p>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-orange-500"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" /></svg>
                  </div>
                </div>
              </div>
              <div className="mb-6 rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-800">Tendência de Despesas por Categoria</h2>
                  <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition">
                    Este Semestre
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                  </button>
                </div>
                <GroupedBarChart />
                <div className="mt-3 flex items-center justify-center gap-6">
                  {CHART_SERIES.map((s) => (
                    <div key={s.key} className="flex items-center gap-2">
                      <div className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
                      <span className="text-xs text-gray-600">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <h2 className="text-sm font-semibold text-gray-800">Atividade Recente</h2>
                  <button className="text-xs font-medium text-[#2563EB] hover:underline">Ver Tudo</button>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Item de Despesa</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Enviado Por</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Data</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Valor</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {RECENT_ACTIVITY.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <CategoryIcon category={entry.category} />
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{entry.item}</p>
                              <p className="text-xs text-gray-400">{entry.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4"><div className="flex items-center gap-2"><Avatar initial={entry.submitterInitial} /><span className="text-sm text-gray-700">{entry.submittedBy}</span></div></td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{entry.date}</td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">${entry.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4"><StatusBadge status={entry.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="border-t border-gray-100 px-6 py-4">
                  <p className="text-sm text-gray-400">Exibindo {RECENT_ACTIVITY.length} de 12 despesas</p>
                </div>
              </div>
            </>
          )}
          {abaAtiva === "expenses" && (
            <div className="flex h-64 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
              <p className="text-sm text-gray-500">Lista de despesas em breve</p>
            </div>
          )}
          {abaAtiva === "team" && (
            <div className="flex h-64 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
              <p className="text-sm text-gray-500">Membros da equipe em breve</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
