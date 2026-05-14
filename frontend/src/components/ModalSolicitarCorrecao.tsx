import { useState } from "react";

const SUGESTOES = [
  "Descreva o destino da viagem com mais detalhes",
  "Justificativa insuficiente para as datas solicitadas",
  "Documentação de suporte incompleta",
];

const MIN_CHARS = 20;
const MAX_CHARS = 500;

interface Props {
  solicitacao: { descricao: string; reqId: string; aluno?: string };
  onClose: () => void;
  onConfirmar: (note: string) => void;
  confirmando?: boolean;
}

export default function ModalSolicitarCorrecao({ solicitacao, onClose, onConfirmar, confirmando }: Props) {
  const [note, setNote] = useState("");

  const valido = note.trim().length >= MIN_CHARS;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valido || confirmando) return;
    onConfirmar(note.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-amber-600">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Solicitar Correção</h2>
              <p className="mt-0.5 text-sm text-gray-500">
                {solicitacao.reqId} • {solicitacao.descricao}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={confirmando}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Descrição */}
        <div className="px-6 pb-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            Você está solicitando ao aluno{" "}
            {solicitacao.aluno ? (
              <span className="font-semibold text-gray-900">{solicitacao.aluno}</span>
            ) : (
              "solicitante"
            )}{" "}
            que corrija a despesa{" "}
            <span className="font-semibold text-gray-900">{solicitacao.descricao}</span>.
            Descreva claramente o que precisa ser corrigido ou complementado.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <div>
            <label className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-gray-700">
              Instrução de Correção
              <span className="text-amber-500">*</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, MAX_CHARS))}
              placeholder="Descreva o que precisa ser corrigido ou complementado na solicitação..."
              rows={4}
              disabled={confirmando}
              className={`w-full resize-none rounded-lg border px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:ring-1 disabled:opacity-60 ${
                note.length > 0 && !valido
                  ? "border-amber-400 focus:border-amber-400 focus:ring-amber-400"
                  : "border-gray-300 focus:border-amber-400 focus:ring-amber-400"
              }`}
            />
            <div className="mt-1 flex items-center justify-between">
              <p className={`text-xs ${note.length > 0 && !valido ? "text-amber-600" : "text-gray-400"}`}>
                Mínimo {MIN_CHARS} caracteres.
              </p>
              <p className="text-xs text-gray-400">
                {note.length} / {MAX_CHARS}
              </p>
            </div>
          </div>

          {/* Sugestões rápidas */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Sugestões Rápidas</p>
            <div className="flex flex-wrap gap-2">
              {SUGESTOES.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={confirmando}
                  onClick={() => setNote(s)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    note === s
                      ? "border-amber-400 bg-amber-50 text-amber-700"
                      : "border-gray-300 text-gray-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={confirmando}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!valido || confirmando}
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {confirmando ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Solicitando...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  Solicitar Correção
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
