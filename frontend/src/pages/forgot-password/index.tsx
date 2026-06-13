import { useState } from "react";
import { useRouter } from "next/router";
import { forgotPassword } from "@/services/auth";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      const result = await forgotPassword(email);
      if (result.ok) {
        setEnviado(true);
      } else {
        setErro("Não foi possível processar sua solicitação. Tente novamente.");
      }
    } catch {
      setErro("Erro de conexão com o servidor.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-200 dark:bg-gray-950 px-4 py-10">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-2xl shadow-2xl">

        {/* Painel esquerdo */}
        <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-[#1e2d3d] p-10 md:flex">
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/5" />
          <div className="absolute top-32 -right-10 h-40 w-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/5" />

          <div className="relative z-10">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="h-6 w-6">
                  <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
                  <path d="M13.06 15.473a48.45 48.45 0 017.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 01-.46.71 47.878 47.878 0 00-8.105 4.342.75.75 0 01-.832 0 47.877 47.877 0 00-8.104-4.342.75.75 0 01-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 016 13.18v1.27a1.5 1.5 0 00-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.729 6.729 0 00.551-1.608 1.5 1.5 0 00.14-2.67v-.645a48.549 48.549 0 013.44 1.668 2.25 2.25 0 002.12 0z" />
                  <path d="M4.462 19.462c.42-.419.753-.89 1-1.394.453.213.902.434 1.347.661a6.743 6.743 0 01-1.286 1.794.75.75 0 11-1.06-1.06z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-white">SGDA</span>
            </div>

            <h1 className="mb-3 text-4xl font-bold leading-tight text-white">
              Recuperar<br />Acesso
            </h1>
            <p className="text-sm leading-relaxed text-gray-400">
              Informe o e-mail cadastrado e enviaremos um link para você criar uma nova senha com segurança.
            </p>

            <div className="mt-8 rounded-xl bg-white/5 p-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
                Como funciona
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <span className="text-xs font-bold text-gray-300">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Informe seu e-mail</p>
                    <p className="text-xs text-gray-400">O e-mail cadastrado na plataforma</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <span className="text-xs font-bold text-gray-300">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Verifique sua caixa de entrada</p>
                    <p className="text-xs text-gray-400">Enviaremos um link de redefinição</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <span className="text-xs font-bold text-gray-300">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Crie uma nova senha</p>
                    <p className="text-xs text-gray-400">Acesse o link e redefina sua senha</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="relative z-10 text-xs text-gray-500">© 2026 SGDA</p>
        </div>

        {/* Painel direito */}
        <div className="flex flex-1 flex-col justify-center bg-white dark:bg-gray-900 px-10 py-12">
          <div className="mx-auto w-full max-w-sm">

            {enviado ? (
              /* Estado de sucesso */
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-green-600">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Solicitação recebida</h2>
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  Se o e-mail{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>{" "}
                  estiver cadastrado, você receberá as instruções de redefinição em breve.
                  Verifique também a pasta de spam.
                </p>
                <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                  O link expira em 30 minutos.
                </p>
                <button
                  onClick={() => router.push("/login")}
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563EB] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8]"
                >
                  Voltar ao Login
                </button>
                <button
                  onClick={() => { setEnviado(false); setEmail(""); }}
                  className="mt-3 w-full text-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Reenviar para outro e-mail
                </button>
              </div>
            ) : (
              /* Formulário */
              <>
                <button
                  onClick={() => router.push("/login")}
                  className="mb-6 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
                  </svg>
                  Voltar ao login
                </button>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Esqueceu sua senha?</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Digite seu e-mail e enviaremos um link para redefinir sua senha.
                </p>

                <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                  {erro && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                      <p className="text-sm text-red-700">{erro}</p>
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      E-mail <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                          <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                          <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
                        </svg>
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Digite seu e-mail cadastrado"
                        required
                        disabled={carregando}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 py-2.5 pl-9 pr-4 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={carregando}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563EB] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <>
                        Enviar link de redefinição
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                          <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  Lembrou sua senha?{" "}
                  <a href="/login" className="font-medium text-[#2563EB] hover:underline">
                    Fazer login
                  </a>
                </p>
              </>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
