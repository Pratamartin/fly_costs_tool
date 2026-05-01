import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminSidebar from "@/components/AdminSidebar";
import ModalCriarProjeto, { NovoDadosProjeto } from "@/components/ModalCriarProjeto";

type ProjectStatus = "Ativo" | "Concluído" | "Pausado";

interface Project {
  id: string;
  name: string;
  department: string;
  coordinator: { name: string; role: string; initial: string; color: string };
  budgetSpent: number;
  budgetTotal: number;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
}

const PROJECTS: Project[] = [
  {
    id: "PRJ-001",
    name: "Laboratório de Robótica 2026",
    department: "Engenharia",
    coordinator: { name: "Dr. Marcelo Silva", role: "Coordenador", initial: "M", color: "#3b82f6" },
    budgetSpent: 45250,
    budgetTotal: 150000,
    status: "Ativo",
    startDate: "Jan 2026",
    endDate: "Dez 2026",
  },
  {
    id: "PRJ-002",
    name: "Bolsa IA Alpha",
    department: "Ciência da Computação",
    coordinator: { name: "Profa. Carla Rocha", role: "Coordenadora", initial: "C", color: "#8b5cf6" },
    budgetSpent: 92000,
    budgetTotal: 100000,
    status: "Ativo",
    startDate: "Mar 2025",
    endDate: "Fev 2026",
  },
  {
    id: "PRJ-003",
    name: "Simpósio Bio-Tech 2025",
    department: "Biologia",
    coordinator: { name: "Dr. Rafael Andrade", role: "Coordenador", initial: "R", color: "#10b981" },
    budgetSpent: 38500,
    budgetTotal: 38500,
    status: "Concluído",
    startDate: "Ago 2025",
    endDate: "Nov 2025",
  },
  {
    id: "PRJ-004",
    name: "Upgrade Cloud Infraestrutura",
    department: "TI Institucional",
    coordinator: { name: "Eng. Tatiana Lima", role: "Coordenadora", initial: "T", color: "#f59e0b" },
    budgetSpent: 61000,
    budgetTotal: 80000,
    status: "Pausado",
    startDate: "Set 2025",
    endDate: "Abr 2026",
  },
  {
    id: "PRJ-005",
    name: "Bolsa Viagem Internacional",
    department: "Pesquisa",
    coordinator: { name: "Profa. Juliana Melo", role: "Coordenadora", initial: "J", color: "#ec4899" },
    budgetSpent: 22000,
    budgetTotal: 60000,
    status: "Ativo",
    startDate: "Fev 2026",
    endDate: "Jul 2026",
  },
];


function StatusBadge({ status }: { status: ProjectStatus }) {
  const config: Record<ProjectStatus, { dot: string; text: string; bg: string }> = {
    Ativo: { dot: "bg-green-400", text: "text-green-700", bg: "bg-green-50" },
    Concluído: { dot: "bg-gray-400", text: "text-gray-600", bg: "bg-gray-100" },
    Pausado: { dot: "bg-orange-400", text: "text-orange-700", bg: "bg-orange-50" },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}

function BudgetBar({ spent, total }: { spent: number; total: number }) {
  const pct = Math.min(100, Math.round((spent / total) * 100));
  const barColor = pct >= 100 ? "bg-gray-400" : pct >= 85 ? "bg-amber-400" : "bg-blue-500";
  const fmt = (v: number) =>
    v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`;
  return (
    <div className="min-w-[140px]">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{fmt(spent)} gasto</span>
        <span>de {fmt(total)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs text-gray-400 mt-0.5 text-right">{pct}%</div>
    </div>
  );
}

export default function AdminProjects() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [deptFilter, setDeptFilter] = useState("Todos");
  const [showModalCriar, setShowModalCriar] = useState(false);

  function handleCriarProjeto(data: NovoDadosProjeto) {
    console.log("Novo projeto:", data);
  }

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) router.push("/login");
  }, [router]);

  const filtered = PROJECTS.filter((p) => {
    const matchSearch =
      search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "Todos" || p.status === statusFilter;
    const matchDept = deptFilter === "Todos" || p.department === deptFilter;
    return matchSearch && matchStatus && matchDept;
  });

  const departments = ["Todos", ...Array.from(new Set(PROJECTS.map((p) => p.department)))];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar active="projects" />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Projetos</h1>
            <p className="text-sm text-gray-500 mt-0.5">Gerencie e acompanhe todos os projetos acadêmicos</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors relative">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button
              onClick={() => setShowModalCriar(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Criar Projeto
            </button>
          </div>
        </header>

        <main className="flex-1 px-8 py-6">
          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px] relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar projetos por nome ou ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 bg-white"
              >
                <option>Todos os Status</option>
                <option value="Ativo">Ativo</option>
                <option value="Concluído">Concluído</option>
                <option value="Pausado">Pausado</option>
              </select>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 bg-white"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d === "Todos" ? "Todos os Departamentos" : d}
                  </option>
                ))}
              </select>
              <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                Aplicar Filtros
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">
                    Detalhes do Projeto
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">
                    Coordenador
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">
                    Utilização do Orçamento
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((project) => (
                  <tr
                    key={project.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => router.push("/dashboard/admin/projects/detalhe")}
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{project.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {project.id} · {project.department} · {project.startDate} – {project.endDate}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ backgroundColor: project.coordinator.color }}
                        >
                          {project.coordinator.initial}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{project.coordinator.name}</p>
                          <p className="text-xs text-gray-400">{project.coordinator.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <BudgetBar spent={project.budgetSpent} total={project.budgetTotal} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={project.status} />
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push("/dashboard/admin/projects/detalhe");
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver detalhes"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Exibindo 1 a {filtered.length} de 24 projetos
              </p>
              <div className="flex items-center gap-1">
                <button className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  Anterior
                </button>
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                      n === 1
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 border border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <span className="px-2 text-gray-400 text-sm">...</span>
                <button className="w-8 h-8 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  5
                </button>
                <button className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  Próximo
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-6">
            © 2026 Academic Expense Management System. Todos os direitos reservados.
          </p>
        </main>
      </div>

      {showModalCriar && (
        <ModalCriarProjeto
          onClose={() => setShowModalCriar(false)}
          onConfirm={handleCriarProjeto}
        />
      )}
    </div>
  );
}
