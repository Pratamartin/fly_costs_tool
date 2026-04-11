import { useState } from "react";

interface Props {
  solicitacao: { descricao: string; reqId: string; valor: number };
  onClose: () => void;
  onConfirmar: (motivo: string) => void;
}

export default function ModalRejeitar({ solicitacao, onClose, onConfirmar }: Props) {
  const [motivo, setMotivo] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onConfirmar(motivo);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Rejeitar Solicitação</h2>
            <p className="mt-0.5 text-sm text-red-500">
              Informe o motivo da rejeição para o aluno.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Info da solicitação */}
        <div className="mx-6 mt-5 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-sm font-semibold text-gray-800">{solicitacao.descricao}</p>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs text-gray-400">{solicitacao.reqId}</span>
            <span className="text-sm font-bold text-gray-700">
              R$ {solicitacao.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Motivo da Rejeição
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva o motivo pelo qual a solicitação está sendo rejeitada..."
              rows={4}
              required
              className="w-full resize-none rounded-lg border border-gray-300 py-2.5 px-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
            >
              Confirmar Rejeição
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
