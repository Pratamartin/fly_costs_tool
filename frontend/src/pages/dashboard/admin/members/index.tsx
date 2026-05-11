import { useState } from "react";
import { useRouter } from "next/router";
import AdminSidebar from "@/components/AdminSidebar";
import ModalConvite from "@/components/ModalConvite";
import { generateInviteLink } from "@/services/invites";

type Role = "ALUNO" | "COORDENADOR";

const ROLE_INFO: Record<Role, { label: string; description: string; badge: string }> = {
  ALUNO: {
    label: "Aluno",
    description: "Acessa o sistema para submeter solicitações de despesa de viagem e acompanhar o status das suas solicitações.",
    badge: "bg-violet-50 text-violet-700 ring-violet-200",
  },
  COORDENADOR: {
    label: "Coordenador",
    description: "Pode visualizar projetos, aprovar ou rejeitar solicitações de despesa e gerenciar orçamentos de projetos específicos.",
    badge: "bg-blue-50 text-blue-700 ring-blue-200",
  },
};

function LinkCard({ role }: { role: Role }) {
  const [copied, setCopied] = useState(false);
  const link = generateInviteLink(role);
  const info = ROLE_INFO[role];

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback silencioso
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${info.badge}`}>
          {info.label}
        </span>
      </div>
      <p className="mb-4 text-sm text-gray-500">{info.description}</p>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
          <p className="truncate text-sm text-blue-600 font-mono">{link}</p>
        </div>
        <button
          onClick={handleCopy}
          className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
            copied
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          {copied ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
              Copiado!
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
              </svg>
              Copiar Link
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function AdminMembers() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  // Protege a rota
  if (typeof window !== "undefined" && !localStorage.getItem("accessToken")) {
    router.push("/login");
    return null;
  }

  const userName =
    typeof window !== "undefined"
      ? (localStorage.getItem("userName") ?? undefined)
      : undefined;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar active="members" userName={userName} />

      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-3xl px-6 py-10">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Gerenciar Membros</h1>
              <p className="mt-1 text-sm text-gray-500">
                Gere e compartilhe links de convite para onboarding de alunos e coordenadores.
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 rounded-lg bg-[#1e2d3d] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#16202c] transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
              Convidar Membro
            </button>
          </div>

          {/* Info banner */}
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0 text-amber-500">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-amber-800">Código de convite atual</p>
              <p className="mt-0.5 text-sm text-amber-700">
                Todos os links usam o código <span className="font-mono font-bold">CONVITE2026</span>. Compartilhe apenas com pessoas autorizadas.
              </p>
            </div>
          </div>

          {/* Link cards */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
              Links de Acesso
            </h2>
            <LinkCard role="ALUNO" />
            <LinkCard role="COORDENADOR" />
          </div>

          {/* Future: invite history table */}
          <div className="mt-10 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="mx-auto mb-3 h-8 w-8 text-gray-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            <p className="text-sm font-medium text-gray-500">Histórico de convites</p>
            <p className="mt-1 text-xs text-gray-400">
              O rastreamento de convites enviados estará disponível em uma próxima versão.
            </p>
          </div>
        </div>
      </main>

      <ModalConvite open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
