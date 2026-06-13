import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { resetPassword } from "@/services/auth";

function validarSenha(senha: string) {
  const erros: string[] = [];
  if (senha.length < 8) erros.push("Mínimo de 8 caracteres");
  if (!/[A-Z]/.test(senha)) erros.push("Pelo menos 1 letra maiúscula");
  if (!/\d/.test(senha)) erros.push("Pelo menos 1 número");
  return erros;
}

export default function ResetPassword() {
  const router = useRouter();
  const { token: tokenQuery } = router.query;

  const [form, setForm] = useState({ codigo: "", senha: "", confirmar: "" });
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [errosSenha, setErrosSenha] = useState<string[]>([]);
  const [tocouSenha, setTocouSenha] = useState(false);

  const tokenDaUrl = typeof tokenQuery === "string" ? tokenQuery : "";

  useEffect(() => {
    if (router.isReady && tokenDaUrl) {
      setForm((prev) => ({ ...prev, codigo: tokenDaUrl }));
    }
  }, [router.isReady, tokenDaUrl]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "senha") {
      setErrosSenha(validarSenha(value));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setTocouSenha(true);

    if (!form.codigo.trim()) {
      setErro("Informe o código de redefinição recebido no e-mail.");
      return;
    }

    const erros = validarSenha(form.senha);
    if (erros.length > 0) {
      setErrosSenha(erros);
      return;
    }

    if (form.senha !== form.confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }

    setCarregando(true);
    try {
      const result = await resetPassword(form.codigo.trim(), form.senha);
      if (result.ok) {
        setSucesso(true);
        setTimeout(() => router.push("/login"), 3000);
      } else if (result.error === "TOKEN_EXPIRED") {
        setErro("Este link expirou. Solicite um novo link de redefinição.");
      } else if (result.error === "TOKEN_INVALID") {
        setErro("Link inválido. Solicite um novo link de redefinição.");
      } else {
        setErro("Não foi possível redefinir sua senha. Tente novamente.");
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
              Nova<br />Senha
            </h1>
            <p className="text-sm leading-relaxed text-gray-400">
              Crie uma senha forte para proteger sua conta na plataforma SGDA.
            </p>

            <div className="mt-8 rounded-xl bg-white/5 p-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
                Requisitos da senha
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-gray-400">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-gray-300">Mínimo de 8 caracteres</p>
                </div>
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-gray-400">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-gray-300">Pelo menos 1 letra maiúscula</p>
                </div>
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-gray-400">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-gray-300">Pelo menos 1 número</p>
                </div>
              </div>
            </div>
          </div>

          <p className="relative z-10 text-xs text-gray-500">© 2026 SGDA</p>
        </div>

        {/* Painel direito */}
        <div className="flex flex-1 flex-col justify-center bg-white dark:bg-gray-900 px-10 py-12">
          <div className="mx-auto w-full max-w-sm">

            {sucesso ? (
              /* Estado de sucesso */
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-green-600">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Senha redefinida!</h2>
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  Sua senha foi alterada com sucesso. Você será redirecionado para o login em instantes.
                </p>
                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-400 dark:text-gray-500">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Redirecionando...
                </div>
                <button
                  onClick={() => router.push("/login")}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563EB] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8]"
                >
                  Ir para o Login agora
                </button>
              </div>
            ) : (
              /* Formulário de redefinição */
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

                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Criar nova senha</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Escolha uma senha segura para acessar o sistema.
                </p>

                <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                  {erro && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                      <p className="text-sm text-red-700">{erro}</p>
                    </div>
                  )}

                  {/* Código de redefinição */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Código de redefinição <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="codigo"
                      value={form.codigo}
                      onChange={handleChange}
                      placeholder="Cole aqui o código recebido no e-mail"
                      required
                      disabled={carregando}
                      className={`w-full rounded-lg border bg-gray-50 dark:bg-gray-800 px-3 py-2.5 font-mono text-xs text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-1 disabled:opacity-50 ${
                        !form.codigo.trim() && tocouSenha
                          ? "border-red-400 focus:border-red-400 focus:ring-red-400"
                          : "border-gray-300 dark:border-gray-600 focus:border-[#2563EB] focus:ring-[#2563EB]"
                      }`}
                    />
                    {tokenDaUrl && (
                      <p className="mt-1 text-xs text-green-600">Código preenchido automaticamente via link do e-mail.</p>
                    )}
                  </div>

                  {/* Nova senha */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nova senha <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                          <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <input
                        type={mostrarSenha ? "text" : "password"}
                        name="senha"
                        value={form.senha}
                        onChange={handleChange}
                        onBlur={() => setTocouSenha(true)}
                        placeholder="••••••••"
                        required
                        disabled={carregando}
                        className={`w-full rounded-lg border bg-gray-50 dark:bg-gray-800 py-2.5 pl-9 pr-10 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-1 disabled:opacity-50 ${
                          tocouSenha && errosSenha.length > 0
                            ? "border-red-400 focus:border-red-400 focus:ring-red-400"
                            : "border-gray-300 dark:border-gray-600 focus:border-[#2563EB] focus:ring-[#2563EB]"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarSenha(!mostrarSenha)}
                        disabled={carregando}
                        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        {mostrarSenha ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                            <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z" clipRule="evenodd" />
                            <path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                            <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                            <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    </div>

                    {/* Requisitos inline */}
                    {tocouSenha && form.senha.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {[
                          { regra: form.senha.length >= 8, texto: "Mínimo de 8 caracteres" },
                          { regra: /[A-Z]/.test(form.senha), texto: "Pelo menos 1 maiúscula" },
                          { regra: /\d/.test(form.senha), texto: "Pelo menos 1 número" },
                        ].map(({ regra, texto }) => (
                          <div key={texto} className="flex items-center gap-1.5">
                            {regra ? (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 shrink-0 text-green-500">
                                <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 shrink-0 text-red-400">
                                <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                              </svg>
                            )}
                            <span className={`text-xs ${regra ? "text-green-600" : "text-red-500"}`}>{texto}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Confirmar senha */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Confirmar senha <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                          <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <input
                        type={mostrarConfirmar ? "text" : "password"}
                        name="confirmar"
                        value={form.confirmar}
                        onChange={handleChange}
                        placeholder="••••••••"
                        required
                        disabled={carregando}
                        className={`w-full rounded-lg border bg-gray-50 dark:bg-gray-800 py-2.5 pl-9 pr-10 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-1 disabled:opacity-50 ${
                          form.confirmar.length > 0 && form.confirmar !== form.senha
                            ? "border-red-400 focus:border-red-400 focus:ring-red-400"
                            : "border-gray-300 dark:border-gray-600 focus:border-[#2563EB] focus:ring-[#2563EB]"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                        disabled={carregando}
                        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        {mostrarConfirmar ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                            <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z" clipRule="evenodd" />
                            <path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                            <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                            <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {form.confirmar.length > 0 && form.confirmar !== form.senha && (
                      <p className="mt-1 text-xs text-red-500">As senhas não coincidem</p>
                    )}
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
                        Salvando...
                      </>
                    ) : (
                      <>
                        Redefinir senha
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                          <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
