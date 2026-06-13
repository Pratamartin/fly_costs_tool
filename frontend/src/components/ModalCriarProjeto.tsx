import { useState, useEffect } from "react";
import { listCategories } from "@/services/categories";
import type { ExpenseCategory } from "@/services/categories";
import { getToken } from "@/lib/getToken";

const MIN_TOPICS = 1;

export interface NovoDadosProjeto {
  name: string;
  code: string;
  budget: number;
  topics: string[];
}

interface ModalCriarProjetoProps {
  onClose: () => void;
  onConfirm: (data: NovoDadosProjeto) => void;
  carregando?: boolean;
  erro?: string | null;
}

export default function ModalCriarProjeto({ onClose, onConfirm, carregando = false, erro = null }: ModalCriarProjetoProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [budget, setBudget] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [showTopicPicker, setShowTopicPicker] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; code?: string; budget?: string; topics?: string }>({});
  const [categorias, setCategorias] = useState<ExpenseCategory[]>([]);
  const [carregandoCategorias, setCarregandoCategorias] = useState(true);

  useEffect(() => {
    setCarregandoCategorias(true);
    const token = getToken() || undefined;
    listCategories(undefined, token).then((result) => {
      if (result.ok) {
        setCategorias(result.data);
        setTopics(result.data.slice(0, 3).map((c) => c.name));
      }
      setCarregandoCategorias(false);
    });
  }, []);

  function removeTopic(topic: string) {
    setTopics((prev) => prev.filter((t) => t !== topic));
  }

  function addTopic(topic: string) {
    if (availableToAdd.length === 0) return;
    if (!topics.includes(topic)) {
      setTopics((prev) => [...prev, topic]);
    }
    setShowTopicPicker(false);
  }

  function validate() {
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = "Nome do projeto é obrigatório.";
    if (!code.trim()) errs.code = "Código do projeto é obrigatório.";
    const budgetNum = parseFloat(budget.replace(",", "."));
    if (!budget || isNaN(budgetNum) || budgetNum <= 0) errs.budget = "Informe um orçamento válido.";
    if (topics.length < MIN_TOPICS) errs.topics = "Selecione ao menos um tópico de custo.";
    return errs;
  }

  function handleSubmit() {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const normalizedTopics = topics.map((t) => categorias.find((c) => c.name === t)?.normalizedName ?? t);
    onConfirm({ name: name.trim(), code: code.trim().toUpperCase(), budget: parseFloat(budget.replace(",", ".")), topics: normalizedTopics });
    onClose();
  }

  const availableTopicsNames = categorias.map((c) => c.name);
  const availableToAdd = availableTopicsNames.filter((t) => !topics.includes(t));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start gap-3 px-6 pt-6 pb-5 border-b border-gray-100">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-gray-900">Criar Novo Projeto</h2>
            <p className="text-sm text-gray-500">Configure um novo projeto acadêmico e defina os tópicos de custo.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* PROJECT DETAILS */}
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-blue-500">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Detalhes do Projeto</span>
            </div>

            <label className="block mb-1.5 text-sm font-medium text-gray-700">
              Nome do Projeto <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0-6a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" clipRule="evenodd" />
                </svg>
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: undefined })); }}
                placeholder="ex.: Montagem Lab de Robótica 2026"
                className={`w-full rounded-lg border py-2.5 pl-9 pr-4 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-1 transition ${errors.name ? "border-red-400 focus:border-red-400 focus:ring-red-400" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"}`}
              />
            </div>
            {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name}</p>}
            <p className="mt-1.5 text-xs text-gray-400">Um nome claro e identificável para o projeto.</p>

            <label className="mt-4 block mb-1.5 text-sm font-medium text-gray-700">
              Código do Projeto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value); setErrors((prev) => ({ ...prev, code: undefined })); }}
              placeholder="ex.: LAB-ROBOT-2026"
              className={`w-full rounded-lg border py-2.5 px-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-1 transition uppercase ${errors.code ? "border-red-400 focus:border-red-400 focus:ring-red-400" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"}`}
            />
            {errors.code && <p className="mt-1.5 text-xs text-red-500">{errors.code}</p>}
            <p className="mt-1.5 text-xs text-gray-400">Código único para identificar o projeto no sistema.</p>
          </div>

          {/* FINANCIAL SETUP */}
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-base">💰</span>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Configuração Financeira</span>
            </div>

            <label className="block mb-1.5 text-sm font-medium text-gray-700">
              Orçamento Total <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-medium text-gray-400">
                $
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={budget}
                onChange={(e) => { setBudget(e.target.value); setErrors((prev) => ({ ...prev, budget: undefined })); }}
                placeholder="0.00"
                className={`w-full rounded-lg border py-2.5 pl-8 pr-4 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-1 transition ${errors.budget ? "border-red-400 focus:border-red-400 focus:ring-red-400" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"}`}
              />
            </div>
            {errors.budget && <p className="mt-1.5 text-xs text-red-500">{errors.budget}</p>}
            <p className="mt-1.5 text-xs text-gray-400">Máximo de despesas permitidas para este projeto.</p>
          </div>

          {/* COST TOPICS */}
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-blue-500">
                  <path fillRule="evenodd" d="M6 4.75A.75.75 0 016.75 4h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 4.75zM6 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 10zm0 5.25a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75a.75.75 0 01-.75-.75zM1.99 4.75a1 1 0 011-1H3a1 1 0 110 2h-.01a1 1 0 01-1-1zm1 5.25a1 1 0 100 2H3a1 1 0 100-2h-.01zm0 5.25a1 1 0 100 2H3a1 1 0 100-2h-.01z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Tópicos de Custo</span>
              </div>
              <span className="text-xs font-semibold text-blue-600">
                {topics.length} selecionado{topics.length !== 1 ? "s" : ""}
              </span>
            </div>
            <p className="mb-3 text-xs text-gray-400">
              {carregandoCategorias ? "Carregando categorias..." : "Selecione as categorias de custo para este projeto (mínimo 1)."}
            </p>

            <div className="flex flex-wrap gap-2">
              {topics.map((topic) => (
                <span
                  key={topic}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#2563EB] px-3 py-1.5 text-xs font-semibold text-white"
                >
                  {topic}
                  <button
                    onClick={() => removeTopic(topic)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-white/20 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                  </button>
                </span>
              ))}

              {availableToAdd.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowTopicPicker((v) => !v)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                    </svg>
                    Adicionar Tópico
                  </button>

                  {showTopicPicker && (
                    <div className="absolute left-0 top-full mt-1 z-10 w-52 rounded-xl border border-gray-200 bg-white shadow-xl py-1">
                      {availableToAdd.length === 0 ? (
                        <p className="px-3 py-2 text-xs text-gray-400">Todos os tópicos já adicionados.</p>
                      ) : availableToAdd.map((topic) => (
                        <button
                          key={topic}
                          onClick={() => addTopic(topic)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                          {topic}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {errors.topics && <p className="mt-2 text-xs text-red-500">{errors.topics}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 space-y-3">
          {erro && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erro}</p>
          )}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={carregando}
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={carregando}
              className="flex items-center gap-2 rounded-lg bg-[#2563EB] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1d4ed8] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {carregando ? (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
              )}
              {carregando ? "Criando..." : "Criar Projeto"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
