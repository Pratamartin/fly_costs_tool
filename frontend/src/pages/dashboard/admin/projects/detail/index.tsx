import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuthStore } from "@/store/authStore";
import { getToken } from "@/lib/getToken";
import AdminSidebar from "@/components/AdminSidebar";
import { getProjectById, updateProject, type Project, type UpdateProjectPayload } from "@/services/projects";
import { listCategories, type ExpenseCategory } from "@/services/categories";
import ThemeToggle from "@/components/ThemeToggle";

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
  const [project, setProject] = useState<Project | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregar, setErroCarregar] = useState<string | null>(null);

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
                <label className="block mb-1.5 text-sm font-medium text-gray-700">Código do Projeto <span className="text-red-500">*</span></label>
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
              <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                {/* Orçamento Total */}
                <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-5 shadow-sm">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Orçamento Total</p>
                    <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-50 sm:text-2xl">{fmtBRL(project.budget)}</p>
                    <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-gray-400 dark:text-gray-500">
                      Código: <span className="font-mono font-semibold text-gray-600 dark:text-gray-400">{project.code}</span>
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
              <div className="mb-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Tendência de Despesas por Categoria</h2>
                  <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                    Este Semestre
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                  </button>
                </div>
                <GroupedBarChart />
                <div className="mt-3 flex items-center justify-center gap-6">
                  {CHART_SERIES.map((s) => (
                    <div key={s.key} className="flex items-center gap-2">
                      <div className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
                      <span className="text-xs text-gray-600 dark:text-gray-400">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4">
                  <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Atividade Recente</h2>
                  <button className="text-xs font-medium text-[#2563EB] hover:underline">Ver Tudo</button>
                </div>
                {/* Desktop table */}
                <table className="hidden w-full md:table">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Item de Despesa</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Enviado Por</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Data</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Valor</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {RECENT_ACTIVITY.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <CategoryIcon category={entry.category} />
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">{entry.item}</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500">{entry.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4"><div className="flex items-center gap-2"><Avatar initial={entry.submitterInitial} /><span className="text-sm text-gray-700 dark:text-gray-300">{entry.submittedBy}</span></div></td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{entry.date}</td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-50">${entry.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4"><StatusBadge status={entry.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="border-t border-gray-100 dark:border-gray-800 px-6 py-4">
                  <p className="text-sm text-gray-400 dark:text-gray-500">Exibindo {RECENT_ACTIVITY.length} de 12 despesas</p>
                </div>

                {/* Cards — mobile */}
                <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                  {RECENT_ACTIVITY.map((entry) => (
                    <div key={entry.id} className="px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <CategoryIcon category={entry.category} />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 truncate">{entry.item}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{entry.category}</p>
                          </div>
                        </div>
                        <StatusBadge status={entry.status} />
                      </div>
                      <div className="flex items-center justify-between pl-11">
                        <div className="flex items-center gap-2">
                          <Avatar initial={entry.submitterInitial} />
                          <span className="text-xs text-gray-600 dark:text-gray-400">{entry.submittedBy}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">${entry.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{entry.date}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
