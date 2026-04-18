import { useState } from "react";

export type CategoriaIcone = "componentes" | "livros" | "viagem" | "nuvem";

export interface NovaDespesaData {
  projeto: string;
  descricao: string;
  valor: number;
  categoria: CategoriaIcone;
  sugestaoCompra: string;
}

interface Props {
  onClose: () => void;
  onSubmit: (data: NovaDespesaData) => void;
  carregando?: boolean;
  erro?: string | null;
}

const categorias: { value: CategoriaIcone; label: string }[] = [
  { value: "componentes", label: "Componentes / Hardware" },
  { value: "livros", label: "Livros / Material Didático" },
  { value: "viagem", label: "Viagem / Transporte" },
  { value: "nuvem", label: "Software / Cloud / Outros" },
];

export default function ModalNovaDespesa({ onClose, onSubmit, carregando = false, erro = null }: Props) {
  const [form, setForm] = useState({
    projeto: "",
    nome: "",
    valor: "",
    categoria: "" as CategoriaIcone | "",
    sugestaoCompra: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (carregando) return;
    onSubmit({
      projeto: form.projeto,
      descricao: form.nome,
      valor: parseFloat(form.valor),
      categoria: form.categoria as CategoriaIcone,
      sugestaoCompra: form.sugestaoCompra,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Solicitar Despesa</h2>
            <p className="mt-0.5 text-sm text-[#4F46E5]">
              Preencha os detalhes da sua despesa acadêmica.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={carregando}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Erro */}
          {erro && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-700">{erro}</p>
            </div>
          )}

          {/* Projeto */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Selecionar Projeto
            </label>
            <div className="relative">
              <select
                name="projeto"
                value={form.projeto}
                onChange={handleChange}
                disabled={carregando}
                required
                className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pl-3 pr-8 text-sm text-gray-700 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] disabled:opacity-50"
              >
                <option value="" disabled>Escolha um projeto...</option>
                <option>Laboratório de Robótica</option>
                <option>Bolsa de Pesquisa em IA</option>
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Categoria
            </label>
            <div className="relative">
              <select
                name="categoria"
                value={form.categoria}
                onChange={handleChange}
                disabled={carregando}
                required
                className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pl-3 pr-8 text-sm text-gray-700 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] disabled:opacity-50"
              >
                <option value="" disabled>Escolha uma categoria...</option>
                {categorias.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
          </div>

          {/* Nome da despesa */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Nome da Despesa
            </label>
            <input
              type="text"
              name="nome"
              value={form.nome}
              onChange={handleChange}
              disabled={carregando}
              placeholder="ex.: Microcontroladores Arduino"
              required
              className="w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] disabled:opacity-50"
            />
          </div>

          {/* Valor */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Valor Estimado
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-medium text-gray-400">
                R$
              </span>
              <input
                type="number"
                name="valor"
                value={form.valor}
                onChange={handleChange}
                disabled={carregando}
                placeholder="0,00"
                min="0"
                step="0.01"
                required
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] disabled:opacity-50"
              />
            </div>
          </div>

          {/* Sugestão de onde comprar */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Sugestão de Onde Comprar
              <span className="ml-1 text-xs font-normal text-gray-400">(opcional)</span>
            </label>
            <textarea
              name="sugestaoCompra"
              value={form.sugestaoCompra}
              onChange={handleChange}
              disabled={carregando}
              placeholder="ex.: Amazon, Mercado Livre, loja física Kalunga..."
              rows={2}
              className="w-full resize-none rounded-lg border border-gray-300 py-2.5 px-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] disabled:opacity-50"
            />
          </div>

          {/* Ações */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={carregando}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={carregando}
              className="flex items-center justify-center rounded-lg bg-[#4F46E5] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#4338CA] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:ring-offset-2 disabled:opacity-50 gap-2"
            >
              {carregando ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enviando...
                </>
              ) : (
                "Enviar Solicitação"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
