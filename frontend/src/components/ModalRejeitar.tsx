import { useState } from "react";

const MOTIVOS_RAPIDOS = [
  "Excede o orçamento alocado",
  "Cotação de fornecedor ausente",
  "Requer aprovação departamental primeiro",
];

const MIN_CHARS = 10;
const MAX_CHARS = 500;

interface Props {
  solicitacao: { descricao: string; reqId: string; aluno?: string };
  onClose: () => void;
  onConfirmar: (motivo: string) => void;
}

export default function ModalRejeitar({ solicitacao, onClose, onConfirmar }: Props) {
  const [motivo, setMotivo] = useState("");

  const valido = motivo.trim().length >= MIN_CHARS;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valido) return;
    onConfirmar(motivo.trim());
  }

  function inserirMotivo(texto: string) {
    setMotivo(texto);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-800 shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-red-600">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-50">Rejeitar Solicitação de Despesa</h2>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                {solicitacao.reqId} • {solicitacao.descricao}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Descrição */}
        <div className="px-6 pb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Você está prestes a rejeitar a solicitação de{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-50">
              {solicitacao.descricao}
            </span>
            {solicitacao.aluno ? (
              <> enviada por <span className="font-semibold text-gray-900 dark:text-gray-50">{solicitacao.aluno}</span>.</>
            ) : (
              "."
            )}{" "}
            Por favor, forneça um motivo para esta rejeição. Ele será visível para o aluno e salvo no registro de auditoria.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <div>
            <label className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Motivo da Rejeição
              <span className="text-red-500">*</span>
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value.slice(0, MAX_CHARS))}
              placeholder="Explique por que esta solicitação está sendo rejeitada (ex.: Excede o orçamento, Cotação incompleta, Não alinhado com os objetivos do projeto...)"
              rows={4}
              className={`w-full resize-none rounded-lg border px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:ring-1 ${
                motivo.length > 0 && !valido
                  ? "border-red-400 focus:border-red-400 focus:ring-red-400"
                  : "border-gray-300 dark:border-gray-600 focus:border-red-400 focus:ring-red-400"
              } dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500`}
            />
            <div className="mt-1 flex items-center justify-between">
              <p className={`text-xs ${motivo.length > 0 && !valido ? "text-red-500" : "text-gray-400 dark:text-gray-500"}`}>
                Mínimo {MIN_CHARS} caracteres.
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {motivo.length} / {MAX_CHARS}
              </p>
            </div>
          </div>

          {/* Inserção rápida */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Inserção Rápida</p>
            <div className="flex flex-wrap gap-2">
              {MOTIVOS_RAPIDOS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => inserirMotivo(m)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    motivo === m
                      ? "border-red-400 bg-red-50 text-red-700"
                      : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 dark:border-gray-600 px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!valido}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              Confirmar Rejeição
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
