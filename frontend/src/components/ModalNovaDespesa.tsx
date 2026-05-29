import { useState, useEffect, useRef } from "react";
import { listSurveys, uploadSurveyFile, type Survey } from "@/services/surveys";

const QUALIS_VALUES = ["A1", "A2", "A3", "A4", "B1", "B2", "B3", "B4", "C", "Sem Qualis"];

const CIDADES_BRASIL = [
  "Aracaju/SE",
  "Belém/PA",
  "Belo Horizonte/MG",
  "Blumenau/SC",
  "Boa Vista/RR",
  "Brasília/DF",
  "Campina Grande/PB",
  "Campinas/SP",
  "Campo Grande/MS",
  "Caruaru/PE",
  "Cascavel/PR",
  "Contagem/MG",
  "Cuiabá/MT",
  "Curitiba/PR",
  "Diadema/SP",
  "Dourados/MS",
  "Duque de Caxias/RJ",
  "Feira de Santana/BA",
  "Florianópolis/SC",
  "Fortaleza/CE",
  "Goiânia/GO",
  "Guarulhos/SP",
  "Ilhéus/BA",
  "Imperatriz/MA",
  "João Pessoa/PB",
  "Joinville/SC",
  "Juazeiro do Norte/CE",
  "Juiz de Fora/MG",
  "Londrina/PR",
  "Macapá/AP",
  "Maceió/AL",
  "Manaus/AM",
  "Maringá/PR",
  "Montes Claros/MG",
  "Mossoró/RN",
  "Natal/RN",
  "Niterói/RJ",
  "Nova Iguaçu/RJ",
  "Olinda/PE",
  "Osasco/SP",
  "Palmas/TO",
  "Parintins/AM",
  "Pelotas/RS",
  "Porto Alegre/RS",
  "Porto Velho/RO",
  "Ponta Grossa/PR",
  "Recife/PE",
  "Ribeirão Preto/SP",
  "Rio Branco/AC",
  "Rio de Janeiro/RJ",
  "Salvador/BA",
  "Santa Maria/RS",
  "Santarém/PA",
  "Santo André/SP",
  "Santos/SP",
  "São Bernardo do Campo/SP",
  "São José dos Campos/SP",
  "São Luís/MA",
  "São Paulo/SP",
  "Sobral/CE",
  "Sorocaba/SP",
  "Teresina/PI",
  "Uberlândia/MG",
  "Várzea Grande/MT",
  "Vila Velha/ES",
  "Vitória/ES",
  "Vitória da Conquista/BA",
];

export interface NovaDespesaData {
  title: string;
  description?: string;
  event: { name: string; location: string };
  article: { classification: string };
  surveyAnswers: Array<{ expenseCategoryId: string; data: unknown }>;
  memorando: File | null;
}

interface Props {
  onClose: () => void;
  onSubmit: (data: NovaDespesaData) => void;
  carregando?: boolean;
  erro?: string | null;
}

function SpinnerIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function SectionHeader({ number, label }: { number: number; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#4F46E5] text-[10px] font-bold text-white">
        {number}
      </span>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
    </div>
  );
}

function FileDropZone({
  file,
  onChange,
  accept,
  label,
  disabled,
}: {
  file: File | null;
  onChange: (f: File) => void;
  accept: string;
  label: string;
  disabled: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) onChange(f); }}
      onClick={() => inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-4 transition ${
        disabled ? "opacity-50 pointer-events-none" :
        dragging ? "border-[#4F46E5] bg-indigo-50" :
        file ? "border-green-400 bg-green-50" :
        "border-gray-300 bg-gray-50 hover:border-[#4F46E5] hover:bg-indigo-50/40"
      }`}
    >
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => { if (e.target.files?.[0]) onChange(e.target.files[0]); }} />
      {file ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6 text-green-500 mb-1">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
          <p className="text-xs font-medium text-green-700 text-center truncate max-w-full">{file.name}</p>
          <p className="text-[10px] text-green-500 mt-0.5">Clique para substituir</p>
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6 text-gray-400 mb-1">
            <path fillRule="evenodd" d="M5.5 17a4.5 4.5 0 01-1.44-8.765 4.5 4.5 0 018.302-3.046 3.5 3.5 0 014.504 4.272A4 4 0 0115 17H5.5zm3.75-2.75a.75.75 0 001.5 0V9.66l1.95 2.1a.75.75 0 101.1-1.02l-3.25-3.5a.75.75 0 00-1.1 0l-3.25 3.5a.75.75 0 101.1 1.02l1.95-2.1v4.59z" clipRule="evenodd" />
          </svg>
          <p className="text-xs font-medium text-gray-600">{label}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">PDF, JPG, PNG</p>
        </>
      )}
    </div>
  );
}

export default function ModalNovaDespesa({ onClose, onSubmit, carregando = false, erro = null }: Props) {
  // Basic fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Event fields
  const [eventName, setEventName] = useState("");
  const [eventLocation, setEventLocation] = useState("");

  // Article
  const [articleClassification, setArticleClassification] = useState("");

  // Surveys from API
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loadingSurveys, setLoadingSurveys] = useState(true);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set());

  // Passagem aérea fields
  const [passagem, setPassagem] = useState({ departureDate: "", returnDate: "", departureRoute: "", returnRoute: "" });
  const [flightFile, setFlightFile] = useState<File | null>(null);

  // Inscrição
  const [inscricaoFile, setInscricaoFile] = useState<File | null>(null);

  // Hospedagem
  const [hospedagem, setHospedagem] = useState(false);

  // Memorando
  const [memorando, setMemorandum] = useState<File | null>(null);

  // Upload state
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [erroLocal, setErroLocal] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken") ?? "";
    listSurveys(token).then((result) => {
      if (result.ok) setSurveys(result.data);
      setLoadingSurveys(false);
    });
  }, []);

  const passagemSurvey = surveys.find((s) => s.expenseCategory.normalizedName === "passagem-aerea");
  const inscricaoSurvey = surveys.find((s) => s.expenseCategory.normalizedName === "inscricao");
  const hospedagemSurvey = surveys.find((s) => s.expenseCategory.normalizedName === "hospedagem");

  const passagemSelected = passagemSurvey ? selectedCategoryIds.has(passagemSurvey.expenseCategoryId) : false;
  const inscricaoSelected = inscricaoSurvey ? selectedCategoryIds.has(inscricaoSurvey.expenseCategoryId) : false;
  const hospedagemSelected = hospedagemSurvey ? selectedCategoryIds.has(hospedagemSurvey.expenseCategoryId) : false;

  function toggleCategory(categoryId: string) {
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  }

  function updatePassagem(field: keyof typeof passagem, value: string) {
    setPassagem((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (carregando || uploadingFiles) return;
    setErroLocal(null);

    if (!title.trim()) return setErroLocal("O título é obrigatório.");
    if (!eventName.trim()) return setErroLocal("O nome do evento é obrigatório.");
    if (!eventLocation.trim()) return setErroLocal("A localização do evento é obrigatória.");
    if (!articleClassification) return setErroLocal("Selecione a classificação QUALIS do artigo.");
    if (selectedCategoryIds.size === 0) return setErroLocal("Selecione ao menos uma categoria de despesa.");

    if (passagemSelected) {
      if (!passagem.departureDate || !passagem.returnDate || !passagem.departureRoute.trim() || !passagem.returnRoute.trim()) {
        return setErroLocal("Preencha todos os campos obrigatórios de Passagem Aérea.");
      }
      if (new Date(passagem.returnDate) < new Date(passagem.departureDate)) {
        return setErroLocal("A data de volta deve ser após a data de ida.");
      }
    }

    if (inscricaoSelected && !inscricaoFile) {
      return setErroLocal("Anexe o boleto/invoice para a categoria Inscrição.");
    }

    if (!memorando) {
      return setErroLocal("O memorando é obrigatório.");
    }

    const token = localStorage.getItem("accessToken") ?? "";
    setUploadingFiles(true);

    try {
      const surveyAnswers: Array<{ expenseCategoryId: string; data: unknown }> = [];

      // Passagem aérea
      if (passagemSelected && passagemSurvey) {
        let flightSuggestionKey: string | undefined;
        if (flightFile) {
          const uploadResult = await uploadSurveyFile(token, flightFile);
          if (!uploadResult.ok) {
            setErroLocal("Erro ao enviar sugestão de voo. Tente novamente.");
            setUploadingFiles(false);
            return;
          }
          flightSuggestionKey = uploadResult.data.fileKey;
        }
        surveyAnswers.push({
          expenseCategoryId: passagemSurvey.expenseCategoryId,
          data: {
            departureDate: passagem.departureDate,
            returnDate: passagem.returnDate,
            departureRoute: passagem.departureRoute.trim(),
            returnRoute: passagem.returnRoute.trim(),
            ...(flightSuggestionKey ? { flightSuggestionKey } : {}),
          },
        });
      }

      // Inscrição
      if (inscricaoSelected && inscricaoSurvey && inscricaoFile) {
        const uploadResult = await uploadSurveyFile(token, inscricaoFile);
        if (!uploadResult.ok) {
          setErroLocal("Erro ao enviar o boleto/invoice. Tente novamente.");
          setUploadingFiles(false);
          return;
        }
        surveyAnswers.push({
          expenseCategoryId: inscricaoSurvey.expenseCategoryId,
          data: { invoiceKey: uploadResult.data.fileKey },
        });
      }

      // Hospedagem
      if (hospedagemSelected && hospedagemSurvey) {
        surveyAnswers.push({
          expenseCategoryId: hospedagemSurvey.expenseCategoryId,
          data: hospedagem,
        });
      }

      setUploadingFiles(false);
      onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        event: { name: eventName.trim(), location: eventLocation.trim() },
        article: { classification: articleClassification },
        surveyAnswers,
        memorando,
      });
    } catch {
      setErroLocal("Erro inesperado. Tente novamente.");
      setUploadingFiles(false);
    }
  }

  const isSubmitting = carregando || uploadingFiles;
  const displayError = erroLocal ?? erro;

  const inputClass = (disabled: boolean) =>
    `w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition ${disabled ? "opacity-50 bg-gray-50" : "bg-white"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="flex w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl max-h-[92vh]">

        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Enviar Solicitação de Despesa</h2>
            <p className="mt-0.5 text-sm text-[#4F46E5]">Preencha os dados do evento e categorias desejadas.</p>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition disabled:opacity-50">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

            {displayError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-700">{displayError}</p>
              </div>
            )}

            {/* 1 — Dados Básicos */}
            <div>
              <SectionHeader number={1} label="Dados Básicos" />
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Título <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="ex.: Inscrição — SBSC 2026"
                    className={inputClass(isSubmitting)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">Descrição</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Contexto adicional sobre a solicitação..."
                    rows={2}
                    className={`w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition ${isSubmitting ? "opacity-50 bg-gray-50" : "bg-white"}`}
                  />
                </div>
              </div>
            </div>

            {/* 2 — Evento */}
            <div>
              <SectionHeader number={2} label="Evento Acadêmico" />
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Nome do Evento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="ex.: Simpósio Brasileiro de Engenharia de Software (SBES)"
                    className={inputClass(isSubmitting)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Local do Evento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="ex.: Rio de Janeiro/RJ ou Lisboa, Portugal"
                    className={inputClass(isSubmitting)}
                  />
                </div>
              </div>
            </div>

            {/* 3 — Artigo */}
            <div>
              <SectionHeader number={3} label="Dados da Publicação" />
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Classificação QUALIS CAPES <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={articleClassification}
                    onChange={(e) => setArticleClassification(e.target.value)}
                    disabled={isSubmitting}
                    className={`w-full appearance-none rounded-lg border border-gray-300 py-2.5 pl-3 pr-8 text-sm outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition ${isSubmitting ? "opacity-50 bg-gray-50 text-gray-400" : articleClassification ? "bg-white text-gray-800" : "bg-white text-gray-400"}`}
                  >
                    <option value="" disabled>Selecione a classificação...</option>
                    {QUALIS_VALUES.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>

            {/* 4 — Categorias */}
            <div>
              <SectionHeader number={4} label="Categorias de Despesa" />
              {loadingSurveys ? (
                <div className="flex items-center gap-2 py-3 text-sm text-gray-400">
                  <SpinnerIcon className="h-4 w-4 text-[#4F46E5]" /> Carregando categorias...
                </div>
              ) : surveys.length === 0 ? (
                <p className="text-sm text-gray-400 py-2">Nenhuma categoria disponível.</p>
              ) : (
                <div className="space-y-3">
                  {/* Passagem Aérea */}
                  {passagemSurvey && (
                    <div className={`rounded-xl border transition ${passagemSelected ? "border-[#4F46E5] bg-indigo-50/40" : "border-gray-200 bg-white"}`}>
                      <label className="flex cursor-pointer items-center gap-3 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={passagemSelected}
                          onChange={() => toggleCategory(passagemSurvey.expenseCategoryId)}
                          disabled={isSubmitting}
                          className="h-4 w-4 rounded border-gray-300 text-[#4F46E5] focus:ring-[#4F46E5]"
                        />
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-indigo-500 shrink-0">
                            <path d="M16.628 2.397a2.25 2.25 0 00-3.182 0L2.204 13.64a.75.75 0 000 1.06l2.829 2.829a.75.75 0 001.06 0L17.336 6.286a2.25 2.25 0 00-.708-3.889zM3.453 14.704l8.164-8.165 1.414 1.414-8.164 8.165-1.414-1.414z" />
                          </svg>
                          <span className="text-sm font-semibold text-gray-800">Passagem Aérea</span>
                        </div>
                      </label>
                      {passagemSelected && (
                        <div className="border-t border-indigo-100 px-4 pb-4 pt-3 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-600">Data Ida <span className="text-red-500">*</span></label>
                              <input type="date" value={passagem.departureDate} onChange={(e) => updatePassagem("departureDate", e.target.value)} disabled={isSubmitting} className={inputClass(isSubmitting)} />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-600">Data Volta <span className="text-red-500">*</span></label>
                              <input type="date" value={passagem.returnDate} min={passagem.departureDate || undefined} onChange={(e) => updatePassagem("returnDate", e.target.value)} disabled={isSubmitting} className={inputClass(isSubmitting)} />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-600">Trecho Ida <span className="text-red-500">*</span></label>
                              <div className="relative">
                                <select value={passagem.departureRoute} onChange={(e) => updatePassagem("departureRoute", e.target.value)} disabled={isSubmitting} className={`w-full appearance-none rounded-lg border border-gray-300 py-2.5 pl-3 pr-8 text-sm outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition ${isSubmitting ? "opacity-50 bg-gray-50 text-gray-400" : passagem.departureRoute ? "bg-white text-gray-800" : "bg-white text-gray-400"}`}>
                                  <option value="" disabled>Selecione a origem...</option>
                                  {CIDADES_BRASIL.map((c) => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                                </span>
                              </div>
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-600">Trecho Volta <span className="text-red-500">*</span></label>
                              <div className="relative">
                                <select value={passagem.returnRoute} onChange={(e) => updatePassagem("returnRoute", e.target.value)} disabled={isSubmitting} className={`w-full appearance-none rounded-lg border border-gray-300 py-2.5 pl-3 pr-8 text-sm outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition ${isSubmitting ? "opacity-50 bg-gray-50 text-gray-400" : passagem.returnRoute ? "bg-white text-gray-800" : "bg-white text-gray-400"}`}>
                                  <option value="" disabled>Selecione o destino...</option>
                                  {CIDADES_BRASIL.map((c) => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                                </span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600">Sugestão de Voo <span className="text-gray-400">(opcional)</span></label>
                            <FileDropZone file={flightFile} onChange={setFlightFile} accept=".pdf,.jpg,.jpeg,.png" label="Clique ou arraste o arquivo" disabled={isSubmitting} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Inscrição */}
                  {inscricaoSurvey && (
                    <div className={`rounded-xl border transition ${inscricaoSelected ? "border-[#4F46E5] bg-indigo-50/40" : "border-gray-200 bg-white"}`}>
                      <label className="flex cursor-pointer items-center gap-3 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={inscricaoSelected}
                          onChange={() => toggleCategory(inscricaoSurvey.expenseCategoryId)}
                          disabled={isSubmitting}
                          className="h-4 w-4 rounded border-gray-300 text-[#4F46E5] focus:ring-[#4F46E5]"
                        />
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-indigo-500 shrink-0">
                            <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm4.75 6.75a.75.75 0 011.5 0v2.546l.943-1.048a.75.75 0 111.114 1.004l-2.25 2.5a.75.75 0 01-1.114 0l-2.25-2.5a.75.75 0 111.114-1.004l.943 1.048V8.75z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-semibold text-gray-800">Inscrição em Evento</span>
                        </div>
                      </label>
                      {inscricaoSelected && (
                        <div className="border-t border-indigo-100 px-4 pb-4 pt-3">
                          <label className="mb-1 block text-xs font-medium text-gray-600">Boleto / Invoice <span className="text-red-500">*</span></label>
                          <FileDropZone file={inscricaoFile} onChange={setInscricaoFile} accept=".pdf,.jpg,.jpeg,.png" label="Clique ou arraste o boleto/invoice" disabled={isSubmitting} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hospedagem */}
                  {hospedagemSurvey && (
                    <div className={`rounded-xl border transition ${hospedagemSelected ? "border-[#4F46E5] bg-indigo-50/40" : "border-gray-200 bg-white"}`}>
                      <label className="flex cursor-pointer items-center gap-3 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={hospedagemSelected}
                          onChange={() => toggleCategory(hospedagemSurvey.expenseCategoryId)}
                          disabled={isSubmitting}
                          className="h-4 w-4 rounded border-gray-300 text-[#4F46E5] focus:ring-[#4F46E5]"
                        />
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-indigo-500 shrink-0">
                            <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-semibold text-gray-800">Hospedagem</span>
                        </div>
                      </label>
                      {hospedagemSelected && (
                        <div className="border-t border-indigo-100 px-4 pb-4 pt-3">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={hospedagem}
                              onClick={() => setHospedagem((v) => !v)}
                              disabled={isSubmitting}
                              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:ring-offset-2 ${hospedagem ? "bg-[#4F46E5]" : "bg-gray-200"} ${isSubmitting ? "opacity-50" : ""}`}
                            >
                              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${hospedagem ? "translate-x-5" : "translate-x-0"}`} />
                            </button>
                            <span className="text-sm text-gray-700">
                              {hospedagem ? "Solicitar auxílio hospedagem" : "Sem auxílio hospedagem"}
                            </span>
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 5 — Memorando */}
            <div>
              <SectionHeader number={5} label="Memorando" />
              <FileDropZone file={memorando} onChange={setMemorandum} accept=".pdf,.svg,.png,.jpg,.jpeg" label="Clique ou arraste o memorando" disabled={isSubmitting} />
              {!memorando && <p className="mt-1.5 text-[11px] text-red-400">Obrigatório</p>}
            </div>

          </div>

          {/* Footer */}
          <div className="shrink-0 flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="flex items-center justify-center gap-2 rounded-lg bg-[#4F46E5] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#4338CA] transition disabled:opacity-50">
              {isSubmitting ? (
                <><SpinnerIcon /> {uploadingFiles ? "Enviando arquivos..." : "Enviando..."}</>
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
