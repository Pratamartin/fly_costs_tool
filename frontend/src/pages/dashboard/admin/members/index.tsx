import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminSidebar from "@/components/AdminSidebar";
import ModalConvite from "@/components/ModalConvite";
import {
  listInvites,
  revokeInvite,
  buildInviteLink,
  type Invite,
  type InviteStatus,
  type InviteRole,
} from "@/services/invites";
import { getMe } from "@/services/user";

const ROLE_LABEL: Record<InviteRole, string> = {
  ALUNO: "Aluno",
  COORDENADOR: "Coordenador",
  ADMIN: "Admin",
};

const ROLE_BADGE: Record<InviteRole, string> = {
  ALUNO: "bg-violet-50 text-violet-700 ring-violet-200",
  COORDENADOR: "bg-blue-50 text-blue-700 ring-blue-200",
  ADMIN: "bg-rose-50 text-rose-700 ring-rose-200",
};

const STATUS_BADGE: Record<InviteStatus, string> = {
  ATIVO: "bg-green-50 text-green-700 ring-green-200",
  USADO: "bg-gray-100 text-gray-500 ring-gray-200",
  EXPIRADO: "bg-amber-50 text-amber-700 ring-amber-200",
};

function formatExpiry(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function ConfirmDialog({
  onConfirm,
  onCancel,
  loading,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-base font-semibold text-gray-900">Revogar convite?</h3>
        <p className="mt-2 text-sm text-gray-500">
          O código ficará inválido imediatamente e não poderá ser usado para cadastro.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition disabled:opacity-60"
          >
            {loading && (
              <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            Revogar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminMembers() {
  const router = useRouter();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<InviteRole | "">("");
  const [filterStatus, setFilterStatus] = useState<InviteStatus | "">("");
  const [showModal, setShowModal] = useState(false);
  const [revogandoId, setRevogandoId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") ?? "" : "";
  const [userName, setUserName] = useState<string | undefined>(undefined);

  useEffect(() => {
    const t = localStorage.getItem("accessToken");
    if (!t) { router.push("/login"); return; }
    getMe(t).then((r) => {
      if (!r.ok) { localStorage.removeItem("accessToken"); router.push("/login"); }
      else setUserName(r.data.name);
    });
  }, []);

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    carregar();
  }, [filterRole, filterStatus]);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const data = await listInvites(token, {
        role: filterRole || undefined,
        status: filterStatus || undefined,
      });
      setInvites(data);
    } catch {
      setErro("Erro ao carregar convites. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function handleCopyLink(invite: Invite) {
    try {
      await navigator.clipboard.writeText(buildInviteLink(invite.code, invite.role));
      setCopiedId(invite.id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      // fallback silencioso
    }
  }

  async function handleRevogar(id: string) {
    setRevogandoId(id);
    try {
      await revokeInvite(token, id);
      setConfirmId(null);
      showToast("Convite revogado com sucesso.");
      carregar();
    } catch (err) {
      setConfirmId(null);
      showToast(err instanceof Error ? err.message : "Erro ao revogar convite.");
    } finally {
      setRevogandoId(null);
    }
  }

  const canRevoke = (s: InviteStatus) => s === "ATIVO";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar active="members" userName={userName} />

      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl px-6 py-10">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Gerenciar Membros</h1>
              <p className="mt-1 text-sm text-gray-500">
                Gere e gerencie links de convite para alunos e coordenadores.
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

          {/* Filtros */}
          <div className="mb-4 flex flex-wrap gap-3">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as InviteRole | "")}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#1e2d3d] focus:outline-none focus:ring-1 focus:ring-[#1e2d3d]"
            >
              <option value="">Todos os papéis</option>
              <option value="ALUNO">Aluno</option>
              <option value="COORDENADOR">Coordenador</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as InviteStatus | "")}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#1e2d3d] focus:outline-none focus:ring-1 focus:ring-[#1e2d3d]"
            >
              <option value="">Todos os status</option>
              <option value="ATIVO">Ativos</option>
              <option value="USADO">Usados</option>
              <option value="EXPIRADO">Expirados</option>
            </select>
          </div>

          {/* Tabela */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {carregando ? (
              <div className="space-y-px p-1">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />
                ))}
              </div>
            ) : erro ? (
              <div className="px-6 py-10 text-center">
                <p className="text-sm text-red-600">{erro}</p>
                <button onClick={carregar} className="mt-3 text-sm font-medium text-[#1e2d3d] hover:underline">
                  Tentar novamente
                </button>
              </div>
            ) : invites.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="mx-auto mb-3 h-8 w-8 text-gray-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <p className="text-sm font-medium text-gray-500">Nenhum convite encontrado</p>
                <p className="mt-1 text-xs text-gray-400">Gere um novo convite para começar.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Código</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Papel</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Expira em</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invites.map((invite) => (
                    <tr key={invite.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3.5 font-mono font-semibold text-gray-800 tracking-wider">
                        {invite.code}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${ROLE_BADGE[invite.role]}`}>
                          {ROLE_LABEL[invite.role]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_BADGE[invite.status]}`}>
                          {invite.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 text-xs">
                        {invite.status === "USADO" ? "—" : formatExpiry(invite.expiresAt)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          {/* Copiar link */}
                          {invite.status === "ATIVO" && (
                            <button
                              onClick={() => handleCopyLink(invite)}
                              title="Copiar link de convite"
                              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                                copiedId === invite.id
                                  ? "border-green-200 bg-green-50 text-green-700"
                                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              {copiedId === invite.id ? (
                                <>
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                  </svg>
                                  Copiado
                                </>
                              ) : (
                                <>
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                                    <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                                    <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                                  </svg>
                                  Copiar
                                </>
                              )}
                            </button>
                          )}

                          {/* Revogar */}
                          <button
                            onClick={() => canRevoke(invite.status) && setConfirmId(invite.id)}
                            disabled={!canRevoke(invite.status)}
                            title={canRevoke(invite.status) ? "Revogar convite" : "Não pode ser revogado"}
                            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                            </svg>
                            Revogar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Modal novo convite */}
      <ModalConvite
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={carregar}
      />

      {/* Modal confirmação revogar */}
      {confirmId && (
        <ConfirmDialog
          onConfirm={() => handleRevogar(confirmId)}
          onCancel={() => setConfirmId(null)}
          loading={revogandoId === confirmId}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
