import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuthStore } from "@/store/authStore";
import { getToken } from "@/lib/getToken";
import StudentSidebar from "@/components/StudentSidebar";
import {
  getExpenseById,
  updateExpense,
  uploadMemorandum,
  uploadInvoice,
  type Expense,
} from "@/services/expenses";
import { getMe, type UserProfile } from "@/services/user";
import ThemeToggle from "@/components/ThemeToggle";

const QUALIS_VALUES = ["A1", "A2", "A3", "A4", "B1", "B2", "B3", "B4", "C", "Sem Qualis", "Jornal Acadêmico"];

const AGRADECIMENTO_TEXT =
  "O presente trabalho foi realizado com o apoio da Coordenação de Aperfeiçoamento de Pessoal de Nível Superior - Brasil (AUXPE-CAPES-PROEX) - Código de Financiamento 001. Adicionalmente, este trabalho foi parcialmente financiado pela Fundação de Amparo à Pesquisa do Estado do Amazonas - FAPEAM - por meio dos projetos PDPG-CAPES e POSGRAD 2025-2026.";

export default function EditarDespesa() {
  const router = useRouter();
  const { id } = router.query;

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [expense, setExpense] = useState<Expense | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Read-only fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Editable base fields
  const [eventName, setEventName] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [articleClassification, setArticleClassification] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");

  // File uploads
  const [memorandoFile, setMemorandoFile] = useState<File | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [uploadingMemorandum, setUploadingMemorandum] = useState(false);
  const [uploadingInvoice, setUploadingInvoice] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    if (!id || typeof id !== "string") return;
    carregarDados(token, id);
  }, [router, id]);

  async function carregarDados(token: string, expId: string) {
    setCarregando(true);
    const [meResult, expResult] = await Promise.all([
      getMe(token),
      getExpenseById(token, expId),
    ]);

    if (meResult.ok) setUserProfile(meResult.data);
    else if (meResult.error === "UNAUTHORIZED") {
      useAuthStore.getState().clearToken();
      localStorage.removeItem("accessToken");
      router.push("/login");
      return;
    }

    if (expResult.ok) {
      const exp = expResult.data;
      if (exp.status !== "EM_EDICAO") {
        router.push("/dashboard/student");
        return;
      }
      setExpense(exp);
      setTitle(exp.title);
      setDescription(exp.description ?? "");
      setEventName(exp.event?.name ?? "");
      setEventLocation(exp.event?.location ?? "");
      setArticleClassification(exp.article?.classification ?? "");
      setCity(exp.city ?? "");
      setState(exp.state ?? "");
      setCountry(exp.country ?? "");
      setDepartureDate(exp.departureDate ? exp.departureDate.slice(0, 10) : "");
      setReturnDate(exp.returnDate ? exp.returnDate.slice(0, 10) : "");
    } else if (expResult.error === "UNAUTHORIZED") {
      useAuthStore.getState().clearToken();
      localStorage.removeItem("accessToken");
      router.push("/login");
      return;
    } else if (expResult.error === "NOT_FOUND") {
      setErro("Despesa não encontrada.");
    } else {
      setErro("Erro ao carregar despesa.");
    }
    setCarregando(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token || !expense) return;

    if (!eventName.trim() || !eventLocation.trim() || !articleClassification) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }

    setSalvando(true);
    setErro(null);

    const result = await updateExpense(token, expense.id, {
      event: { name: eventName.trim(), location: eventLocation.trim() },
      article: { classification: articleClassification },
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      country: country.trim() || undefined,
      departureDate: departureDate || undefined,
      returnDate: returnDate || undefined,
    });

    if (!result.ok) {
      setSalvando(false);
      if (result.error === "UNAUTHORIZED") {
        useAuthStore.getState().clearToken();
        localStorage.removeItem("accessToken");
        router.push("/login");
      } else if (result.error === "VALIDATION_ERROR") {
        setErro("Dados inválidos. Verifique os campos.");
      } else {
        setErro("Erro ao salvar. Tente novamente.");
      }
      return;
    }

    const updatedExpense = result.data;

    // Upload memorando if selected
    if (memorandoFile) {
      setUploadingMemorandum(true);
      const memResult = await uploadMemorandum(token, updatedExpense.id, memorandoFile);
      setUploadingMemorandum(false);
      if (!memResult.ok) {
        setSalvando(false);
        setErro("Dados salvos, mas falha ao enviar o trabalho publicado. Tente novamente.");
        return;
      }
    }

    // Upload invoice if selected
    if (invoiceFile) {
      setUploadingInvoice(true);
      const invResult = await uploadInvoice(token, updatedExpense.id, invoiceFile);
      setUploadingInvoice(false);
      if (!invResult.ok) {
        setSalvando(false);
        setErro("Dados salvos, mas falha ao enviar a invoice. Tente novamente.");
        return;
      }
    }

    setSalvando(false);
    router.push("/dashboard/student?toast=correctionSubmitted");
  }

  function handleLogout() {
    useAuthStore.getState().clearToken();
    localStorage.removeItem("accessToken");
    router.push("/login");
  }

  const isBusy = salvando || uploadingMemorandum || uploadingInvoice;

  if (carregando) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <svg className="animate-spin h-8 w-8 text-[#4F46E5]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Carregando despesa...</p>
        </div>
      </div>
    );
  }

  if (erro && !expense) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <p className="text-red-600 font-medium">{erro}</p>
          <button
            onClick={() => router.push("/dashboard/student")}
            className="mt-4 text-sm text-[#4F46E5] hover:underline"
          >
            Voltar para o dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!expense) return null;

  const displayId = `#REQ-${expense.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <StudentSidebar userName={userProfile?.name ?? null} onLogout={handleLogout} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex flex-col gap-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard/student")}
              className="rounded-lg p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
              </svg>
            </button>
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-gray-50 sm:text-xl">Corrigir Despesa</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">{displayId} • {expense.title}</p>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6">
          <div className="mx-auto max-w-2xl space-y-5">

            {expense.correctionNote && (
              <div className="flex items-start gap-4 rounded-xl border-l-4 border-amber-400 bg-amber-50 px-6 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="h-5 w-5">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-amber-800">Correção Solicitada pelo Administrador</p>
                  <p className="mt-1 text-sm text-amber-700 leading-relaxed">{expense.correctionNote}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Título e Descrição — somente leitura */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
                <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-4">Identificação (não editável)</h2>
                <div className="space-y-3">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Título</p>
                    <p className="text-sm text-gray-800 dark:text-gray-100 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5">{title}</p>
                  </div>
                  {description && (
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Descrição</p>
                      <p className="text-sm text-gray-800 dark:text-gray-100 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5">{description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Evento e QUALIS */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
                <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-4">Dados do Evento</h2>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      Nome do Evento <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      disabled={isBusy}
                      placeholder="ex.: Simpósio Brasileiro de Engenharia de Software (SBES)"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] disabled:opacity-60 transition"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      Local do Evento <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      disabled={isBusy}
                      placeholder="ex.: Rio de Janeiro/RJ ou Lisboa, Portugal"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] disabled:opacity-60 transition"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      Classificação QUALIS CAPES <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={articleClassification}
                        onChange={(e) => setArticleClassification(e.target.value)}
                        disabled={isBusy}
                        className={`w-full appearance-none rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 py-2.5 pl-3 pr-8 text-sm outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] disabled:opacity-60 transition ${articleClassification ? "text-gray-800 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"}`}
                      >
                        <option value="" disabled>Selecione a classificação...</option>
                        {QUALIS_VALUES.map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400 dark:text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Destino e Datas */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
                <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-4">Destino e Datas da Viagem</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Cidade</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      disabled={isBusy}
                      placeholder="ex.: Manaus"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] disabled:opacity-60 transition"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Estado</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      disabled={isBusy}
                      placeholder="ex.: AM"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] disabled:opacity-60 transition"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">País</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      disabled={isBusy}
                      placeholder="ex.: Brasil"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] disabled:opacity-60 transition"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Data de ida</label>
                    <input
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      disabled={isBusy}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] disabled:opacity-60 transition"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Data de volta</label>
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      disabled={isBusy}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] disabled:opacity-60 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Trabalho publicado */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
                <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-4">Trabalho publicado</h2>
                <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 leading-relaxed">
                  <p className="font-semibold mb-1">O trabalho deve conter ao final o seguinte texto de agradecimento:</p>
                  <p className="italic">&ldquo;{AGRADECIMENTO_TEXT}&rdquo;</p>
                </div>
                {expense.attachmentKey && !memorandoFile && (
                  <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                    Já existe um trabalho publicado anexado. Selecione um novo arquivo somente se quiser substituí-lo.
                  </p>
                )}
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 hover:border-[#4F46E5] hover:bg-indigo-50 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500">
                    <path fillRule="evenodd" d="M15.621 4.379a3 3 0 00-4.242 0l-7 7a3 3 0 004.241 4.243h.001l.497-.5a.75.75 0 011.064 1.057l-.498.501-.002.002a4.5 4.5 0 01-6.364-6.364l7-7a4.5 4.5 0 016.368 6.36l-3.455 3.553A2.625 2.625 0 119.52 9.52l3.45-3.451a.75.75 0 111.061 1.06l-3.45 3.451a1.125 1.125 0 001.587 1.595l3.454-3.553a3 3 0 000-4.242z" clipRule="evenodd" />
                  </svg>
                  <span className="flex-1 truncate text-sm text-gray-500 dark:text-gray-400">
                    {memorandoFile ? memorandoFile.name : "Selecionar trabalho publicado (PDF)"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="sr-only"
                    disabled={isBusy}
                    onChange={(e) => setMemorandoFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                {memorandoFile && (
                  <button
                    type="button"
                    onClick={() => setMemorandoFile(null)}
                    className="mt-1 text-xs text-red-500 hover:underline"
                  >
                    Remover arquivo
                  </button>
                )}
              </div>

              {/* Invoice — exclusivo da correção */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
                <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-1">Invoice / Boleto</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Anexe a invoice ou boleto conforme solicitado pelo administrador.</p>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 hover:border-[#4F46E5] hover:bg-indigo-50 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500">
                    <path fillRule="evenodd" d="M15.621 4.379a3 3 0 00-4.242 0l-7 7a3 3 0 004.241 4.243h.001l.497-.5a.75.75 0 011.064 1.057l-.498.501-.002.002a4.5 4.5 0 01-6.364-6.364l7-7a4.5 4.5 0 016.368 6.36l-3.455 3.553A2.625 2.625 0 119.52 9.52l3.45-3.451a.75.75 0 111.061 1.06l-3.45 3.451a1.125 1.125 0 001.587 1.595l3.454-3.553a3 3 0 000-4.242z" clipRule="evenodd" />
                  </svg>
                  <span className="flex-1 truncate text-sm text-gray-500 dark:text-gray-400">
                    {invoiceFile ? invoiceFile.name : "Selecionar invoice/boleto (PDF, JPG ou PNG)"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="sr-only"
                    disabled={isBusy}
                    onChange={(e) => setInvoiceFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                {invoiceFile && (
                  <button
                    type="button"
                    onClick={() => setInvoiceFile(null)}
                    className="mt-1 text-xs text-red-500 hover:underline"
                  >
                    Remover arquivo
                  </button>
                )}
              </div>

              {erro && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm text-red-700">{erro}</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pb-6">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/student")}
                  disabled={isBusy}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isBusy}
                  className="flex items-center gap-2 rounded-lg bg-[#4F46E5] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#4338CA] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isBusy ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {uploadingMemorandum ? "Enviando trabalho..." : uploadingInvoice ? "Enviando invoice..." : "Salvando..."}
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                      Enviar Correção
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
