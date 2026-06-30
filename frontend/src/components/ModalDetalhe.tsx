import { useState } from "react";
import { getMemorandumDownloadUrl, type Expense } from "@/services/expenses";

interface ModalDetalheProps {
  despesa: Expense | null;
  token: string;
  onClose: () => void;
}


function statusBadgeColor(status: string): string {
  switch (status) {
    case "PENDENTE":
      return "bg-yellow-100 text-yellow-800";
    case "APROVADO":
      return "bg-green-100 text-green-800";
    case "REJEITADO":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function ModalDetalhe({ despesa, token, onClose }: ModalDetalheProps) {
  if (!despesa) return null;

  const [baixandoMemorandum, setBaixandoMemorandum] = useState(false);
  const [erroMemorandum, setErroMemorandum] = useState<string | null>(null);

  async function handleDownloadMemorandum() {
    setBaixandoMemorandum(true);
    setErroMemorandum(null);
    try {
      const result = await getMemorandumDownloadUrl(token, despesa!.id);
      if (result.ok) {
        window.open(result.downloadUrl, "_blank");
      } else {
        setErroMemorandum("Não foi possível obter o link de download.");
      }
    } catch {
      setErroMemorandum("Erro de conexão.");
    } finally {
      setBaixandoMemorandum(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-800 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">Detalhes da Solicitação</h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-400 hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Título e Status */}
          <div>
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{despesa.title}</h3>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeColor(despesa.status)}`}>
                {despesa.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{despesa.id}</p>
          </div>

          {/* Principais Informações */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-gray-50 dark:bg-gray-700 p-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total de Custos</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-50">
                R$ {(despesa.costBreakdowns ?? []).reduce((s, cb) => s + cb.amount, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 dark:bg-gray-700 p-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Destino</p>
              <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-50">{despesa.event?.location ?? "—"}</p>
            </div>
          </div>

          {/* Descrição */}
          {despesa.description && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Descrição</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                {despesa.description}
              </p>
            </div>
          )}

          {/* Trabalho publicado */}
          {despesa.attachmentKey && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Trabalho publicado</h4>
              <div className="flex items-center gap-3 rounded-lg border border-indigo-100 bg-indigo-50 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-indigo-600">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50">PDF anexado</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{despesa.attachmentKey.split("/").pop()}</p>
                </div>
                <button
                  onClick={handleDownloadMemorandum}
                  disabled={baixandoMemorandum}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  {baixandoMemorandum ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Abrindo...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                        <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                        <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                      </svg>
                      Baixar PDF
                    </>
                  )}
                </button>
              </div>
              {erroMemorandum && (
                <p className="mt-1.5 text-xs text-red-600">{erroMemorandum}</p>
              )}
            </div>
          )}

          {/* Informações do Aluno */}
          {despesa.student && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Aluno Solicitante</h4>
              <div className="flex items-center gap-3 rounded-lg bg-gray-50 dark:bg-gray-700 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a5c38] text-sm font-bold text-white">
                  {despesa.student.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{despesa.student.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">ID: {despesa.student.id}</p>
                </div>
              </div>
            </div>
          )}

          {/* Projeto */}
          {despesa.project && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Projeto Associado</h4>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-900">{despesa.project.name}</p>
                <p className="text-xs text-gray-500 mt-1">ID: {despesa.project.id}</p>
              </div>
            </div>
          )}

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Criado em</p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {new Date(despesa.createdAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Atualizado em</p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {new Date(despesa.updatedAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
