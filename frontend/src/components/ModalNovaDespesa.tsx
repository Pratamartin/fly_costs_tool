import { useState, useRef } from "react";

const ESTADOS_BR = [
  { label: "Acre", value: "BR-AC" },
  { label: "Alagoas", value: "BR-AL" },
  { label: "Amapá", value: "BR-AP" },
  { label: "Amazonas", value: "BR-AM" },
  { label: "Bahia", value: "BR-BA" },
  { label: "Ceará", value: "BR-CE" },
  { label: "Distrito Federal", value: "BR-DF" },
  { label: "Espírito Santo", value: "BR-ES" },
  { label: "Goiás", value: "BR-GO" },
  { label: "Maranhão", value: "BR-MA" },
  { label: "Mato Grosso", value: "BR-MT" },
  { label: "Mato Grosso do Sul", value: "BR-MS" },
  { label: "Minas Gerais", value: "BR-MG" },
  { label: "Pará", value: "BR-PA" },
  { label: "Paraíba", value: "BR-PB" },
  { label: "Paraná", value: "BR-PR" },
  { label: "Pernambuco", value: "BR-PE" },
  { label: "Piauí", value: "BR-PI" },
  { label: "Rio de Janeiro", value: "BR-RJ" },
  { label: "Rio Grande do Norte", value: "BR-RN" },
  { label: "Rio Grande do Sul", value: "BR-RS" },
  { label: "Rondônia", value: "BR-RO" },
  { label: "Roraima", value: "BR-RR" },
  { label: "Santa Catarina", value: "BR-SC" },
  { label: "São Paulo", value: "BR-SP" },
  { label: "Sergipe", value: "BR-SE" },
  { label: "Tocantins", value: "BR-TO" },
];

const PAISES = [
  { label: "Brasil", value: "BR" },
  { label: "Argentina", value: "AR" },
  { label: "Chile", value: "CL" },
  { label: "Colômbia", value: "CO" },
  { label: "Estados Unidos", value: "US" },
  { label: "França", value: "FR" },
  { label: "Alemanha", value: "DE" },
  { label: "Itália", value: "IT" },
  { label: "Portugal", value: "PT" },
  { label: "Espanha", value: "ES" },
  { label: "Reino Unido", value: "GB" },
  { label: "Japão", value: "JP" },
  { label: "China", value: "CN" },
  { label: "Canadá", value: "CA" },
  { label: "México", value: "MX" },
  { label: "Uruguai", value: "UY" },
  { label: "Paraguai", value: "PY" },
  { label: "Peru", value: "PE" },
  { label: "Bolívia", value: "BO" },
  { label: "Venezuela", value: "VE" },
];

export interface NovaDespesaData {
  descricao: string;
  descricaoDetalhada: string;
  valor: number;
  sugestaoCompra: string;
  city: string;
  state: string;
  country: string;
  departureDate: string;
  returnDate: string;
  arquivo: File | null;
}

interface Props {
  onClose: () => void;
  onSubmit: (data: NovaDespesaData) => void;
  carregando?: boolean;
  erro?: string | null;
}

const SelectChevron = () => (
  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
    </svg>
  </span>
);

export default function ModalNovaDespesa({ onClose, onSubmit, carregando = false, erro = null }: Props) {
  const [form, setForm] = useState({
    nome: "",
    descricaoDetalhada: "",
    valor: "",
    sugestaoCompra: "",
    city: "",
    state: "",
    country: "BR",
    departureDate: "",
    returnDate: "",
  });
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [arrastandoArquivo, setArrastandoArquivo] = useState(false);
  const inputArquivoRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleArquivo(file: File) {
    setArquivo(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setArrastandoArquivo(false);
    const file = e.dataTransfer.files[0];
    if (file) handleArquivo(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (carregando) return;
    onSubmit({
      descricao: form.nome,
      descricaoDetalhada: form.descricaoDetalhada,
      valor: parseFloat(form.valor),
      sugestaoCompra: form.sugestaoCompra,
      city: form.city,
      state: form.state,
      country: form.country || "BR",
      departureDate: form.departureDate,
      returnDate: form.returnDate,
      arquivo,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="flex w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl max-h-[92vh]">

        {/* Header fixo */}
        <div className="flex shrink-0 items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Enviar Solicitação de Despesa</h2>
            <p className="mt-0.5 text-sm text-[#4F46E5]">
              Forneça os detalhes da sua despesa acadêmica.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={carregando}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Corpo com scroll */}
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            {erro && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-700">{erro}</p>
              </div>
            )}

            {/* Nome da despesa */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Nome da Despesa <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nome"
                value={form.nome}
                onChange={handleChange}
                disabled={carregando}
                placeholder="Digite o nome da despesa..."
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] disabled:opacity-50"
              />
            </div>

            {/* Descrição detalhada */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Descrição da Despesa
              </label>
              <textarea
                name="descricaoDetalhada"
                value={form.descricaoDetalhada}
                onChange={handleChange}
                disabled={carregando}
                placeholder="Forneça uma descrição detalhada da sua despesa..."
                rows={3}
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] disabled:opacity-50"
              />
            </div>

            {/* Valor */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Valor Estimado <span className="text-red-500">*</span>
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

            {/* Informações de Viagem */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-4">
              <p className="text-sm font-semibold text-gray-700">Informações de Viagem / Local do Evento</p>

              <div className="grid grid-cols-2 gap-3">
                {/* Cidade */}
                <div className="col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">
                    Cidade <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    disabled={carregando}
                    placeholder="ex.: Curitiba"
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] disabled:opacity-50"
                  />
                </div>

                {/* Estado */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">
                    Estado <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="state"
                      value={form.state}
                      onChange={handleChange}
                      disabled={carregando}
                      required
                      className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-700 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] disabled:opacity-50"
                    >
                      <option value="" disabled>Selecione...</option>
                      {ESTADOS_BR.map((e) => (
                        <option key={e.value} value={e.value}>{e.label}</option>
                      ))}
                    </select>
                    <SelectChevron />
                  </div>
                </div>

                {/* País */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">
                    País
                  </label>
                  <div className="relative">
                    <select
                      name="country"
                      value={form.country}
                      onChange={handleChange}
                      disabled={carregando}
                      className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-700 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] disabled:opacity-50"
                    >
                      {PAISES.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                    <SelectChevron />
                  </div>
                </div>

                {/* Datas */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">
                    Data de Partida <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="departureDate"
                    value={form.departureDate}
                    onChange={handleChange}
                    disabled={carregando}
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">
                    Data de Retorno <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="returnDate"
                    value={form.returnDate}
                    onChange={handleChange}
                    disabled={carregando}
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Sugestão de compra */}
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
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] disabled:opacity-50"
              />
            </div>

            {/* Upload de comprovante */}
            <div>
              <p className="mb-1 text-sm text-gray-500">Anexe seu memorando no espaço abaixo.</p>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Envio de Comprovante
              </label>
              <div
                onDragOver={(e) => { e.preventDefault(); setArrastandoArquivo(true); }}
                onDragLeave={() => setArrastandoArquivo(false)}
                onDrop={handleDrop}
                onClick={() => inputArquivoRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 transition ${
                  arrastandoArquivo
                    ? "border-[#4F46E5] bg-indigo-50"
                    : arquivo
                    ? "border-green-400 bg-green-50"
                    : "border-gray-300 bg-gray-50 hover:border-[#4F46E5] hover:bg-indigo-50/40"
                }`}
              >
                <input
                  ref={inputArquivoRef}
                  type="file"
                  accept=".svg,.png,.jpg,.jpeg,.pdf"
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) handleArquivo(e.target.files[0]); }}
                />
                {arquivo ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-8 w-8 text-green-500 mb-2">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm font-medium text-green-700">{arquivo.name}</p>
                    <p className="text-xs text-green-500 mt-0.5">
                      {(arquivo.size / 1024 / 1024).toFixed(2)} MB · Clique para substituir
                    </p>
                  </>
                ) : (
                  <>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-[#4F46E5]">
                        <path fillRule="evenodd" d="M5.5 17a4.5 4.5 0 01-1.44-8.765 4.5 4.5 0 018.302-3.046 3.5 3.5 0 014.504 4.272A4 4 0 0115 17H5.5zm3.75-2.75a.75.75 0 001.5 0V9.66l1.95 2.1a.75.75 0 101.1-1.02l-3.25-3.5a.75.75 0 00-1.1 0l-3.25 3.5a.75.75 0 101.1 1.02l1.95-2.1v4.59z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-700">Clique para enviar ou arraste e solte</p>
                    <p className="mt-0.5 text-xs text-gray-400">SVG, PNG, JPG ou PDF (MÁX. 5MB)</p>
                  </>
                )}
              </div>
            </div>

          </div>

          {/* Footer fixo */}
          <div className="shrink-0 flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={carregando}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={carregando}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#4F46E5] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#4338CA] transition disabled:opacity-50"
            >
              {carregando ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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
