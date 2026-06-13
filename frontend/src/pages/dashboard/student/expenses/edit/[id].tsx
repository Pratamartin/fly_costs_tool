import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuthStore } from "@/store/authStore";
import { getToken } from "@/lib/getToken";
import StudentSidebar from "@/components/StudentSidebar";
import { getExpenseById, updateExpense, type Expense } from "@/services/expenses";
import { getMe, type UserProfile } from "@/services/user";
import ThemeToggle from "@/components/ThemeToggle";

function fmtDateInput(iso: string) {
  return iso.slice(0, 10);
}

export default function EditarDespesa() {
  const router = useRouter();
  const { id } = router.query;

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [expense, setExpense] = useState<Expense | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [articleClassification, setArticleClassification] = useState("");

  const QUALIS_VALUES = ["A1", "A2", "A3", "A4", "B1", "B2", "B3", "B4", "C", "Sem Qualis"];

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

    if (!title.trim() || !eventName.trim() || !eventLocation.trim() || !articleClassification) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }

    setSalvando(true);
    setErro(null);
    const result = await updateExpense(token, expense.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      event: { name: eventName.trim(), location: eventLocation.trim() },
      article: { classification: articleClassification },
    });
    setSalvando(false);

    if (result.ok) {
      router.push("/dashboard/student?toast=correctionSubmitted");
    } else if (result.error === "UNAUTHORIZED") {
      useAuthStore.getState().clearToken();
      localStorage.removeItem("accessToken");
      router.push("/login");
    } else if (result.error === "VALIDATION_ERROR") {
      setErro("Dados inválidos. Verifique os campos.");
    } else {
      setErro("Erro ao salvar. Tente novamente.");
    }
  }

  function handleLogout() {
    useAuthStore.getState().clearToken();
    localStorage.removeItem("accessToken");
    router.push("/login");
  }

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
        {/* Header */}
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

            {/* Card de instrução de correção */}
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

            {/* Formulário */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-[#4F46E5]">
                  <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                </svg>
                <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">Editar Informações da Despesa</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Título */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Título <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={salvando}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] disabled:opacity-60 transition"
                  />
                </div>

                {/* Descrição */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Descrição
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={salvando}
                    rows={3}
                    className="w-full resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] disabled:opacity-60 transition"
                  />
                </div>

                {/* Evento */}
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      Nome do Evento <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      disabled={salvando}
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
                      disabled={salvando}
                      placeholder="ex.: Rio de Janeiro/RJ ou Lisboa, Portugal"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] disabled:opacity-60 transition"
                    />
                  </div>
                </div>

                {/* Classificação QUALIS */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Classificação QUALIS CAPES <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={articleClassification}
                      onChange={(e) => setArticleClassification(e.target.value)}
                      disabled={salvando}
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

                {erro && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-sm text-red-700">{erro}</p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard/student")}
                    disabled={salvando}
                    className="rounded-lg border border-gray-300 dark:border-gray-600 px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={salvando}
                    className="flex items-center gap-2 rounded-lg bg-[#4F46E5] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#4338CA] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {salvando ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Salvando...
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
          </div>
        </main>
      </div>
    </div>
  );
}
