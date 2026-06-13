import { useState } from "react";
import { createInvite, buildInviteLink, type Invite, type InviteRole } from "@/services/invites";
import { getToken } from "@/lib/getToken";

type Etapa = "configurar" | "gerado";

const PERMISSIONS: Record<InviteRole, { title: string; description: string }> = {
  COORDENADOR: {
    title: "Permissões do Coordenador",
    description:
      "Coordenadores podem visualizar detalhes de projetos, aprovar ou rejeitar solicitações de despesa submetidas por alunos e gerenciar alocações de orçamento para projetos específicos.",
  },
  ALUNO: {
    title: "Permissões do Aluno",
    description:
      "Alunos podem submeter solicitações de despesa de viagem, acompanhar o status de suas solicitações e atualizar as informações do próprio perfil.",
  },
  ADMIN: {
    title: "Permissões do Admin",
    description: "Acesso completo ao sistema: gerenciar membros, projetos, despesas e configurações.",
  },
};

const EXPIRY_OPTIONS = [
  { label: "24 horas (padrão)", hours: 24 },
  { label: "48 horas", hours: 48 },
  { label: "7 dias", hours: 168 },
];

function formatExpiry(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

interface ModalConviteProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export default function ModalConvite({ open, onClose, onCreated }: ModalConviteProps) {
  const [etapa, setEtapa] = useState<Etapa>("configurar");
  const [role, setRole] = useState<InviteRole>("COORDENADOR");
  const [expiryHours, setExpiryHours] = useState(24);
  const [criando, setCriando] = useState(false);
  const [erroGerar, setErroGerar] = useState<string | null>(null);
  const [conviteCriado, setConviteCriado] = useState<Invite | null>(null);
  const [copied, setCopied] = useState(false);

  function handleClose() {
    setEtapa("configurar");
    setRole("COORDENADOR");
    setExpiryHours(24);
    setCriando(false);
    setErroGerar(null);
    setConviteCriado(null);
    setCopied(false);
    onClose();
  }

  async function handleGerar() {
    const token = getToken();
    if (!token) return;

    setErroGerar(null);
    setCriando(true);
    try {
      const expiresAt = new Date(Date.now() + expiryHours * 3600 * 1000).toISOString();
      const invite = await createInvite(token, { role, expiresAt });
      setConviteCriado(invite);
      setEtapa("gerado");
      onCreated?.();
    } catch (err) {
      setErroGerar(err instanceof Error ? err.message : "Erro ao gerar convite");
    } finally {
      setCriando(false);
    }
  }

  async function handleCopy() {
    if (!conviteCriado) return;
    try {
      await navigator.clipboard.writeText(buildInviteLink(conviteCriado.code, conviteCriado.role));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback silencioso
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <h2 className="text-base font-semibold text-gray-900">
            {etapa === "configurar" ? "Convidar Membro" : "Convite Gerado"}
          </h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
            aria-label="Fechar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Etapa 1: Configurar */}
        {etapa === "configurar" && (
          <div className="px-6 py-5 space-y-5">
            {/* Role */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Tipo / Papel</label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as InviteRole)}
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-3 pr-8 text-sm text-gray-900 focus:border-[#1e2d3d] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1e2d3d]"
                >
                  <option value="COORDENADOR">Coordenador</option>
                  <option value="ALUNO">Aluno</option>
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Expiry */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Validade do convite</label>
              <div className="flex gap-2">
                {EXPIRY_OPTIONS.map((opt) => (
                  <button
                    key={opt.hours}
                    type="button"
                    onClick={() => setExpiryHours(opt.hours)}
                    className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition ${
                      expiryHours === opt.hours
                        ? "border-[#1e2d3d] bg-[#1e2d3d] text-white"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Permissions box */}
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex gap-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0 text-blue-500">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-blue-900">{PERMISSIONS[role].title}</p>
                  <p className="mt-0.5 text-xs text-blue-700 leading-relaxed">{PERMISSIONS[role].description}</p>
                </div>
              </div>
            </div>

            {erroGerar && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {erroGerar}
              </div>
            )}
          </div>
        )}

        {/* Etapa 2: Gerado */}
        {etapa === "gerado" && conviteCriado && (
          <div className="px-6 py-5 space-y-4">
            {/* Sucesso */}
            <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 shrink-0 text-green-600">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-green-800">Convite gerado com sucesso!</p>
                <p className="text-xs text-green-700">Compartilhe o link abaixo com o convidado.</p>
              </div>
            </div>

            {/* Detalhes */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Código</span>
                <span className="font-mono font-semibold text-gray-800">{conviteCriado.code}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Papel</span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                  conviteCriado.role === "ALUNO"
                    ? "bg-violet-50 text-violet-700 ring-violet-200"
                    : "bg-blue-50 text-blue-700 ring-blue-200"
                }`}>
                  {conviteCriado.role === "ALUNO" ? "Aluno" : "Coordenador"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Expira em</span>
                <span className="text-gray-700">{formatExpiry(conviteCriado.expiresAt)}</span>
              </div>
            </div>

            {/* Link + Copiar */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Link de Convite</label>
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                  <p className="truncate font-mono text-xs text-blue-600">
                    {buildInviteLink(conviteCriado.code, conviteCriado.role)}
                  </p>
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
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
          {etapa === "configurar" ? (
            <>
              <button
                onClick={handleClose}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleGerar}
                disabled={criando}
                className="flex items-center gap-2 rounded-lg bg-[#1e2d3d] px-4 py-2 text-sm font-medium text-white hover:bg-[#16202c] transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {criando ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Gerando...
                  </>
                ) : (
                  "Gerar Convite"
                )}
              </button>
            </>
          ) : (
            <button
              onClick={handleClose}
              className="rounded-lg bg-[#1e2d3d] px-4 py-2 text-sm font-medium text-white hover:bg-[#16202c] transition"
            >
              Fechar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
