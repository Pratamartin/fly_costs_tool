import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { register, login } from "@/services/auth";
import { useAuthStore } from "@/store/authStore";

type FormState = {
  email: string;
  nomeCompleto: string;
  rgPassaporte: string;
  cpf: string;
  dataNascimento: string;
  profissao: string;
  endereco: string;
  codigoBanco: string;
  nomeBanco: string;
  agenciaDigito: string;
  contaDigito: string;
  senha: string;
  confirmarSenha: string;
  codigoConvite: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

function validateSenha(senha: string): string | null {
  if (senha.length < 8) return "Mínimo de 8 caracteres";
  if (!/[A-Z]/.test(senha)) return "Precisa de pelo menos uma letra maiúscula";
  if (!/[a-z]/.test(senha)) return "Precisa de pelo menos uma letra minúscula";
  if (!/\d/.test(senha)) return "Precisa de pelo menos um número";
  if (!/[^A-Z0-9]/i.test(senha)) return "Precisa de pelo menos um caractere especial";
  return null;
}

function validateCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(digits[i]) * (10 - i);
  let r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== Number(digits[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(digits[i]) * (11 - i);
  r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === Number(digits[10]);
}

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.email) errors.email = "E-mail obrigatório";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "E-mail inválido";

  if (!form.nomeCompleto.trim()) errors.nomeCompleto = "Nome obrigatório";

  if (!form.rgPassaporte.trim()) errors.rgPassaporte = "RG ou Passaporte obrigatório";

  if (!form.cpf.trim()) {
    errors.cpf = "CPF obrigatório";
  } else if (!validateCpf(form.cpf)) {
    errors.cpf = "CPF inválido";
  }

  if (!form.dataNascimento) {
    errors.dataNascimento = "Data de nascimento obrigatória";
  } else {
    const date = new Date(form.dataNascimento);
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() - 18);
    if (date > maxDate) errors.dataNascimento = "Você precisa ter pelo menos 18 anos";
  }

  if (!form.profissao.trim()) errors.profissao = "Profissão obrigatória";

  if (!form.endereco.trim()) errors.endereco = "Endereço obrigatório";
  else if (form.endereco.trim().length < 5) errors.endereco = "Endereço muito curto (mínimo 5 caracteres)";

  if (!form.codigoBanco.trim()) errors.codigoBanco = "Código do banco obrigatório";
  else if (!/^\d{3}$/.test(form.codigoBanco.trim())) errors.codigoBanco = "Código COMPE com 3 dígitos (ex: 001)";

  if (!form.nomeBanco.trim()) errors.nomeBanco = "Nome do banco obrigatório";

  if (!form.agenciaDigito.trim()) errors.agenciaDigito = "Agência obrigatória";

  if (!form.contaDigito.trim()) errors.contaDigito = "Conta obrigatória";

  const senhaErro = validateSenha(form.senha);
  if (senhaErro) errors.senha = senhaErro;

  if (!form.confirmarSenha) errors.confirmarSenha = "Confirme sua senha";
  else if (form.senha !== form.confirmarSenha) errors.confirmarSenha = "As senhas não coincidem";

  if (!form.codigoConvite.trim()) errors.codigoConvite = "Código de convite obrigatório";

  return errors;
}

export default function CadastroAluno() {
  const router = useRouter();
  const setToken = useAuthStore((s) => s.setToken);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const [form, setForm] = useState<FormState>({
    email: "",
    nomeCompleto: "",
    rgPassaporte: "",
    cpf: "",
    dataNascimento: "",
    profissao: "",
    endereco: "",
    codigoBanco: "",
    nomeBanco: "",
    agenciaDigito: "",
    contaDigito: "",
    senha: "",
    confirmarSenha: "",
    codigoConvite: "",
  });

  useEffect(() => {
    if (!router.isReady) return;
    const code = router.query.code;
    if (typeof code === "string" && code) {
      setForm((prev) => ({ ...prev, codigoConvite: code }));
    }
  }, [router.isReady, router.query.code]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormState]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);

    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setCarregando(true);
    try {
      const result = await register({
        name: form.nomeCompleto,
        email: form.email,
        password: form.senha,
        role: "ALUNO",
        inviteCode: form.codigoConvite,
        cpf: form.cpf,
        rgPassaporte: form.rgPassaporte,
        birthDate: form.dataNascimento,
        profession: form.profissao,
        address: form.endereco,
        bankCode: form.codigoBanco,
        bankName: form.nomeBanco,
        bankAgency: form.agenciaDigito,
        bankAccount: form.contaDigito,
      });

      if (!result.ok) {
        if (result.error === "EMAIL_CONFLICT") {
          setErrors({ email: "Este e-mail já está cadastrado" });
        } else if (result.error === "INVALID_INVITE_CODE") {
          setErrors({ codigoConvite: "Código de convite inválido" });
        } else if (result.error === "VALIDATION_ERROR") {
          setGlobalError(result.message ?? "Dados inválidos. Verifique os campos e tente novamente.");
        } else {
          setGlobalError("Erro inesperado. Tente novamente mais tarde.");
        }
        return;
      }

      const loginResult = await login({ email: form.email, password: form.senha });

      if (loginResult.ok) {
        localStorage.setItem("accessToken", loginResult.accessToken);
        setToken(loginResult.accessToken);
        router.push("/dashboard/student");
      } else {
        router.push("/login");
      }
    } catch {
      setGlobalError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  const inputClass = (field: keyof FormState) =>
    `w-full rounded-lg border bg-white dark:bg-gray-800 py-2.5 pl-9 pr-4 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-1 transition ${
      errors[field]
        ? "border-red-400 focus:border-red-500 focus:ring-red-200"
        : "border-gray-300 dark:border-gray-600 focus:border-[#4F46E5] focus:ring-[#4F46E5]"
    }`;

  const textareaClass = (field: keyof FormState) =>
    `w-full resize-none rounded-lg border bg-white dark:bg-gray-800 py-2.5 pl-9 pr-4 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-1 transition ${
      errors[field]
        ? "border-red-400 focus:border-red-500 focus:ring-red-200"
        : "border-gray-300 dark:border-gray-600 focus:border-[#4F46E5] focus:ring-[#4F46E5]"
    }`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950 px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4F46E5] shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="h-8 w-8">
              <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
              <path d="M13.06 15.473a48.45 48.45 0 017.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 01-.46.71 47.878 47.878 0 00-8.105 4.342.75.75 0 01-.832 0 47.877 47.877 0 00-8.104-4.342.75.75 0 01-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 016 13.18v1.27a1.5 1.5 0 00-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.729 6.729 0 00.551-1.608 1.5 1.5 0 00.14-2.67v-.645a48.549 48.549 0 013.44 1.668 2.25 2.25 0 002.12 0z" />
              <path d="M4.462 19.462c.42-.419.753-.89 1-1.394.453.213.902.434 1.347.661a6.743 6.743 0 01-1.286 1.794.75.75 0 11-1.06-1.06z" />
            </svg>
          </div>
          <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-gray-50">
            Complete seu Cadastro de Aluno
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Preencha seus dados para configurar sua conta de despesas acadêmicas
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-gray-900 px-8 py-8 shadow-md">
          {globalError && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {globalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-7" noValidate>

            {/* Account Information */}
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#4F46E5] text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
                  </svg>
                </span>
                Informações da Conta
              </h2>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#4F46E5] dark:text-[#818cf8]">
                  Endereço de E-mail
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
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="seu.email@universidade.edu"
                    className={inputClass("email")}
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  Este e-mail será usado para acessar sua conta
                </p>
              </div>
            </div>

            <hr className="border-gray-100 dark:border-gray-700" />

            {/* Personal Information */}
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#4F46E5] text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                    <path fillRule="evenodd" d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1Z" clipRule="evenodd" />
                    <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3Z" />
                  </svg>
                </span>
                Informações Pessoais
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      name="nomeCompleto"
                      value={form.nomeCompleto}
                      onChange={handleChange}
                      placeholder="Digite seu nome completo"
                      className={inputClass("nomeCompleto")}
                    />
                  </div>
                  {errors.nomeCompleto && <p className="mt-1 text-xs text-red-500">{errors.nomeCompleto}</p>}
                </div>

                {/* ID/Passport */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                    RG ou Passaporte <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M1 4.5A2.5 2.5 0 013.5 2h13A2.5 2.5 0 0119 4.5v11a2.5 2.5 0 01-2.5 2.5h-13A2.5 2.5 0 011 15.5v-11zm10 7a4 4 0 10-8 0 4 4 0 008 0zm-2-4.5a2 2 0 11-4 0 2 2 0 014 0zm4-1.5a.75.75 0 000 1.5h2a.75.75 0 000-1.5h-2zm-.75 4a.75.75 0 01.75-.75h2a.75.75 0 010 1.5h-2a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5h2a.75.75 0 000-1.5h-2z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      name="rgPassaporte"
                      value={form.rgPassaporte}
                      onChange={handleChange}
                      placeholder="Número do RG ou Passaporte"
                      className={inputClass("rgPassaporte")}
                    />
                  </div>
                  {errors.rgPassaporte && <p className="mt-1 text-xs text-red-500">{errors.rgPassaporte}</p>}
                </div>

                {/* CPF */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                    CPF <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm1 5a1 1 0 100 2h12a1 1 0 100-2H4z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      name="cpf"
                      value={form.cpf}
                      onChange={handleChange}
                      placeholder="000.000.000-00"
                      className={inputClass("cpf")}
                    />
                  </div>
                  {errors.cpf && <p className="mt-1 text-xs text-red-500">{errors.cpf}</p>}
                </div>

                {/* Date of Birth */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                    Data de Nascimento <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="dataNascimento"
                      value={form.dataNascimento}
                      onChange={handleChange}
                      className={`w-full rounded-lg border bg-white dark:bg-gray-800 py-2.5 px-3 text-sm text-gray-800 dark:text-gray-100 outline-none focus:ring-1 transition ${
                        errors.dataNascimento
                          ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                          : "border-gray-300 dark:border-gray-600 focus:border-[#4F46E5] focus:ring-[#4F46E5]"
                      }`}
                    />
                  </div>
                  {errors.dataNascimento && <p className="mt-1 text-xs text-red-500">{errors.dataNascimento}</p>}
                </div>

                {/* Profession */}
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                    Profissão <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M6 3.75A2.75 2.75 0 018.75 1h2.5A2.75 2.75 0 0114 3.75v.443c.572.055 1.14.122 1.706.2C17.053 4.582 18 5.75 18 7.07v3.469c0 1.126-.694 2.191-1.83 2.54-1.952.599-4.024.921-6.17.921s-4.219-.322-6.17-.921C2.694 12.73 2 11.665 2 10.539V7.07c0-1.321.947-2.489 2.294-2.676A41.047 41.047 0 016 4.193V3.75zm6.5 0v.325a41.622 41.622 0 00-5 0V3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25zM10 10a1 1 0 00-1 1v.01a1 1 0 001 1h.01a1 1 0 001-1V11a1 1 0 00-1-1H10z" clipRule="evenodd" />
                        <path d="M3 15.055v-.684c.126.053.255.1.39.142 2.092.642 4.313.987 6.61.987 2.297 0 4.518-.345 6.61-.987.135-.041.264-.089.39-.142v.684c0 1.347-.985 2.53-2.363 2.686a41.454 41.454 0 01-9.274 0C3.985 17.585 3 16.402 3 15.055z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      name="profissao"
                      value={form.profissao}
                      onChange={handleChange}
                      placeholder="ex: Estudante de Ciências da Computação"
                      className={inputClass("profissao")}
                    />
                  </div>
                  {errors.profissao && <p className="mt-1 text-xs text-red-500">{errors.profissao}</p>}
                </div>

                {/* Address */}
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                    Endereço <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute top-3 left-3 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <textarea
                      name="endereco"
                      value={form.endereco}
                      onChange={handleChange}
                      placeholder="Digite seu endereço completo"
                      rows={3}
                      className={textareaClass("endereco")}
                    />
                  </div>
                  {errors.endereco && <p className="mt-1 text-xs text-red-500">{errors.endereco}</p>}
                </div>
              </div>
            </div>

            <hr className="border-gray-100 dark:border-gray-700" />

            {/* Bank Details */}
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#4F46E5] text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                    <path fillRule="evenodd" d="M8.5 1.709a1 1 0 0 0-1 0L1.63 5.384A1 1 0 0 0 2.13 7H3v5H2a.75.75 0 0 0 0 1.5h12A.75.75 0 0 0 14 12h-1V7h.87a1 1 0 0 0 .5-1.866L8.5 1.709ZM9.25 12V7h-2.5v5h2.5ZM5.25 7v5h-1V7h1Zm6.5 5V7h-1v5h1Z" clipRule="evenodd" />
                  </svg>
                </span>
                Dados Bancários
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {/* Bank Code */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                    Código do Banco <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v.258a33.186 33.186 0 016.668.83.75.75 0 01-.336 1.461 31.28 31.28 0 00-1.103-.232l1.702 7.545a.75.75 0 01-.387.832A4.981 4.981 0 0115 14c-.825 0-1.606-.2-2.294-.556a.75.75 0 01-.387-.832l1.77-7.849a31.743 31.743 0 00-3.339-.254v9.232a19.84 19.84 0 012.518 1.337.75.75 0 01-.758 1.294A18.252 18.252 0 0110 16.13a18.252 18.252 0 01-2.51 1.242.75.75 0 01-.758-1.294 19.84 19.84 0 012.518-1.337V5.51c-1.14.06-2.27.176-3.34.254l1.771 7.85a.75.75 0 01-.387.83A4.981 4.981 0 015 14a4.981 4.981 0 01-2.294-.556.75.75 0 01-.387-.832L4.02 5.067c-.37.07-.738.148-1.103.232a.75.75 0 01-.337-1.462 33.186 33.186 0 016.669-.829V2.75A.75.75 0 0110 2z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      name="codigoBanco"
                      value={form.codigoBanco}
                      onChange={handleChange}
                      placeholder="e.g., 001"
                      className={inputClass("codigoBanco")}
                    />
                  </div>
                  {errors.codigoBanco && <p className="mt-1 text-xs text-red-500">{errors.codigoBanco}</p>}
                </div>

                {/* Bank Name */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                    Nome do Banco <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M4 16.5v-13h-.25a.75.75 0 010-1.5h12.5a.75.75 0 010 1.5H16v13h.25a.75.75 0 010 1.5h-3.5a.75.75 0 01-.75-.75v-2.5a.75.75 0 00-.75-.75h-2.5a.75.75 0 00-.75.75v2.5a.75.75 0 01-.75.75h-3.5a.75.75 0 010-1.5H4zm3-11a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5A.75.75 0 017 5.5zm.75 2.25a.75.75 0 000 1.5h.5a.75.75 0 000-1.5h-.5zm-.75 4a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5a.75.75 0 01-.75-.75zm5.25-6a.75.75 0 000 1.5h.5a.75.75 0 000-1.5h-.5zm-.75 4a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5h.5a.75.75 0 000-1.5h-.5z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      name="nomeBanco"
                      value={form.nomeBanco}
                      onChange={handleChange}
                      placeholder="e.g., Banco do Brasil"
                      className={inputClass("nomeBanco")}
                    />
                  </div>
                  {errors.nomeBanco && <p className="mt-1 text-xs text-red-500">{errors.nomeBanco}</p>}
                </div>

                {/* Agency */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                    Agência + Dígito <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902 1.168.188 2.352.327 3.55.414.28.02.521.18.642.413l1.713 3.293a.75.75 0 001.33 0l1.713-3.293a.783.783 0 01.642-.413 41.102 41.102 0 003.55-.414c1.437-.231 2.43-1.49 2.43-2.902V5.426c0-1.413-.993-2.67-2.43-2.902A41.289 41.289 0 0010 2zM6.75 6a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 2.5a.75.75 0 000 1.5h3.5a.75.75 0 000-1.5h-3.5z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      name="agenciaDigito"
                      value={form.agenciaDigito}
                      onChange={handleChange}
                      placeholder="e.g., 1234-5"
                      className={inputClass("agenciaDigito")}
                    />
                  </div>
                  {errors.agenciaDigito && <p className="mt-1 text-xs text-red-500">{errors.agenciaDigito}</p>}
                </div>

                {/* Account */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                    Conta + Dígito <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path d="M2.273 5.625A4.483 4.483 0 015.25 4.5h5.5c.41 0 .806.055 1.182.158A3.001 3.001 0 0015 7.5h1.5a.75.75 0 010 1.5H15v1h1.5a.75.75 0 010 1.5H15v1h1.5a.75.75 0 010 1.5H15a3 3 0 01-2.88 2.158A4.5 4.5 0 0110.75 16h-5.5a4.5 4.5 0 01-4.5-4.5v-5a4.483 4.483 0 011.523-3.375zM12.5 8.5v7a3 3 0 003-3v-1a3 3 0 00-3-3z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      name="contaDigito"
                      value={form.contaDigito}
                      onChange={handleChange}
                      placeholder="e.g., 12345678-9"
                      className={inputClass("contaDigito")}
                    />
                  </div>
                  {errors.contaDigito && <p className="mt-1 text-xs text-red-500">{errors.contaDigito}</p>}
                </div>
              </div>
            </div>

            <hr className="border-gray-100 dark:border-gray-700" />

            {/* Security */}
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#4F46E5] text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                    <path fillRule="evenodd" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z" clipRule="evenodd" />
                  </svg>
                </span>
                Segurança
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {/* Password */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                    Senha <span className="text-red-500">*</span>
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
                      placeholder="Crie uma senha forte"
                      className={`w-full rounded-lg border bg-white dark:bg-gray-800 py-2.5 pl-9 pr-10 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-1 transition ${
                        errors.senha
                          ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                          : "border-gray-300 dark:border-gray-600 focus:border-[#4F46E5] focus:ring-[#4F46E5]"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
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
                  {errors.senha
                    ? <p className="mt-1 text-xs text-red-500">{errors.senha}</p>
                    : <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Mínimo 8 caracteres com letras e números</p>
                  }
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                    Confirmar Senha <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <input
                      type={mostrarConfirmarSenha ? "text" : "password"}
                      name="confirmarSenha"
                      value={form.confirmarSenha}
                      onChange={handleChange}
                      placeholder="Digite sua senha novamente"
                      className={`w-full rounded-lg border bg-white dark:bg-gray-800 py-2.5 pl-9 pr-10 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-1 transition ${
                        errors.confirmarSenha
                          ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                          : "border-gray-300 dark:border-gray-600 focus:border-[#4F46E5] focus:ring-[#4F46E5]"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {mostrarConfirmarSenha ? (
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
                  {errors.confirmarSenha && <p className="mt-1 text-xs text-red-500">{errors.confirmarSenha}</p>}
                </div>

                {/* Invite Code */}
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                    Código de Convite <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M15.988 3.012A2.25 2.25 0 0118 5.25v6.5A2.25 2.25 0 0115.75 14H13.5V7A2.5 2.5 0 0011 4.5H8.128a2.252 2.252 0 011.884-1.488A2.25 2.25 0 0112.25 2h1.5a2.25 2.25 0 012.238 1.012zM11.5 3.25a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v.25h-3v-.25z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M2 7a1 1 0 011-1h8a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V7zm2 3.25a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75zm0 3.5a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      name="codigoConvite"
                      value={form.codigoConvite}
                      onChange={handleChange}
                      placeholder="Digite seu código de convite"
                      className={inputClass("codigoConvite")}
                    />
                  </div>
                  {errors.codigoConvite && <p className="mt-1 text-xs text-red-500">{errors.codigoConvite}</p>}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#4F46E5] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4338CA] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {carregando ? (
                <>
                  <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processando...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  Concluir Cadastro
                </>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-gray-400 dark:text-gray-500">
            Ao se cadastrar, você concorda com nossos{" "}
            <a href="#" className="text-[#4F46E5] hover:underline">Termos de Serviço</a>{" "}
            e{" "}
            <a href="#" className="text-[#4F46E5] hover:underline">Política de Privacidade</a>
          </p>
        </div>

        <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
          Já tem uma conta?{" "}
          <a href="/login" className="font-medium text-[#4F46E5] hover:underline">
            Entre aqui
          </a>
        </p>
      </div>
    </main>
  );
}
