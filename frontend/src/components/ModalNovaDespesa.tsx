import { useState, useRef } from "react";

interface Props {
  onClose: () => void;
}

export default function ModalNovaDespesa({ onClose }: Props) {
  const [form, setForm] = useState({ projeto: "", nome: "", valor: "", arquivo: null as File | null });
  const [arrastando, setArrastando] = useState(false);
  const inputFileRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleArquivo(file: File) {
    setForm({ ...form, arquivo: file });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setArrastando(false);
    const file = e.dataTransfer.files[0];
    if (file) handleArquivo(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: integrar com o backend
    console.log(form);
    onClose();
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
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
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
                required
                className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pl-3 pr-8 text-sm text-gray-700 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
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
              placeholder="ex.: Microcontroladores Arduino"
              required
              className="w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
            />
          </div>

          {/* Valor */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Valor
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
                placeholder="0,00"
                min="0"
                step="0.01"
                required
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
              />
            </div>
          </div>

          {/* Upload de comprovante */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Comprovante
            </label>
            <div
              onClick={() => inputFileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
              onDragLeave={() => setArrastando(false)}
              onDrop={handleDrop}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 transition ${
                arrastando
                  ? "border-[#4F46E5] bg-[#4F46E5]/5"
                  : "border-gray-200 bg-gray-50 hover:border-[#4F46E5] hover:bg-[#4F46E5]/5"
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4F46E5]/10">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-[#4F46E5]">
                  <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v8.69l2.72-2.72a.75.75 0 111.06 1.06l-4 4a.75.75 0 01-1.06 0l-4-4a.75.75 0 111.06-1.06l2.72 2.72V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M3 15.75A2.75 2.75 0 015.75 13h1.5a.75.75 0 010 1.5h-1.5c-.69 0-1.25.56-1.25 1.25v.5c0 .69.56 1.25 1.25 1.25h8.5c.69 0 1.25-.56 1.25-1.25v-.5c0-.69-.56-1.25-1.25-1.25h-1.5a.75.75 0 010-1.5h1.5A2.75 2.75 0 0117 15.75v.5A2.75 2.75 0 0114.25 19h-8.5A2.75 2.75 0 013 16.25v-.5z" clipRule="evenodd" />
                </svg>
              </div>
              {form.arquivo ? (
                <p className="text-sm font-medium text-[#4F46E5]">{form.arquivo.name}</p>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-700">
                    Clique para enviar ou arraste o arquivo
                  </p>
                  <p className="text-xs text-gray-400">SVG, PNG, JPG ou PDF (máx. 5MB)</p>
                </>
              )}
            </div>
            <input
              ref={inputFileRef}
              type="file"
              accept=".svg,.png,.jpg,.jpeg,.pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleArquivo(file);
              }}
            />
          </div>

          {/* Ações */}
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
              className="rounded-lg bg-[#4F46E5] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#4338CA] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:ring-offset-2"
            >
              Enviar Solicitação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
