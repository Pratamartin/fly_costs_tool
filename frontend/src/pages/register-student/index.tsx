import { useState } from "react";

export default function CadastroAluno() {
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [form, setForm] = useState({
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

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log(form);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4F46E5] shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="white"
              className="h-8 w-8"
            >
              <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
              <path d="M13.06 15.473a48.45 48.45 0 017.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 01-.46.71 47.878 47.878 0 00-8.105 4.342.75.75 0 01-.832 0 47.877 47.877 0 00-8.104-4.342.75.75 0 01-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 016 13.18v1.27a1.5 1.5 0 00-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.729 6.729 0 00.551-1.608 1.5 1.5 0 00.14-2.67v-.645a48.549 48.549 0 013.44 1.668 2.25 2.25 0 002.12 0z" />
              <path d="M4.462 19.462c.42-.419.753-.89 1-1.394.453.213.902.434 1.347.661a6.743 6.743 0 01-1.286 1.794.75.75 0 11-1.06-1.06z" />
            </svg>
          </div>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">
            Conclua seu Cadastro de Aluno
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Preencha seus dados para configurar sua conta de despesas acadêmicas
          </p>
        </div>

        <div className="rounded-2xl bg-white px-8 py-8 shadow-md">
          <form onSubmit={handleSubmit} className="space-y-7">

            <div>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#4F46E5] text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
                  </svg>
                </span>
                Informações da Conta
              </h2>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#4F46E5]">
                  E-mail
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
                    required
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 pl-9 pr-4 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                  />
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            <div>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#4F46E5] text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                    <path fillRule="evenodd" d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1Z" clipRule="evenodd" />
                    <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3Z" />
                  </svg>
                </span>
                Informações Pessoais
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-1 block text-xs font-medium text-gray-600">
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
                      required
                      className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-4 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                    />
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-1 block text-xs font-medium text-gray-600">
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
                      placeholder="RG ou número do passaporte"
                      required
                      className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-4 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                    />
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-1 block text-xs font-medium text-gray-600">
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
                      required
                      className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-4 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                    />
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Data de Nascimento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dataNascimento"
                    value={form.dataNascimento}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm text-gray-800 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                  />
                </div>

                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Curso / Profissão <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      name="profissao"
                      value={form.profissao}
                      onChange={handleChange}
                      placeholder="ex.: Aluno de Ciência da Computação"
                      required
                      className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-4 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-600">
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
                      required
                      rows={3}
                      className="w-full resize-none rounded-lg border border-gray-300 py-2.5 pl-9 pr-4 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            <div>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#4F46E5] text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                    <path fillRule="evenodd" d="M8.5 1.709a1 1 0 0 0-1 0L1.63 5.384A1 1 0 0 0 2.13 7H3v5H2a.75.75 0 0 0 0 1.5h12A.75.75 0 0 0 14 12h-1V7h.87a1 1 0 0 0 .5-1.866L8.5 1.709ZM9.25 12V7h-2.5v5h2.5ZM5.25 7v5h-1V7h1Zm6.5 5V7h-1v5h1Z" clipRule="evenodd" />
                  </svg>
                </span>
                Dados Bancários
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Código do Banco <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      name="codigoBanco"
                      value={form.codigoBanco}
                      onChange={handleChange}
                      placeholder="ex.: 001"
                      required
                      className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-4 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Nome do Banco <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      name="nomeBanco"
                      value={form.nomeBanco}
                      onChange={handleChange}
                      placeholder="ex.: Banco do Brasil"
                      required
                      className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-4 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Agência + Dígito <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path d="M10.75 10.818v2.614A3.13 3.13 0 0011.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 00-1.138-.432zM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 00-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.627-.514.909 0 .184.058.39.33.615z" />
                        <path fillRule="evenodd" d="M9.99 1.75C5.44 1.75 1.75 5.44 1.75 9.99c0 4.551 3.69 8.24 8.24 8.24 4.551 0 8.24-3.689 8.24-8.24 0-4.55-3.689-8.24-8.24-8.24zm-.75 3.5a.75.75 0 011.5 0v.73a3.592 3.592 0 011.5.554c.456.297.75.714.75 1.216v.01a.75.75 0 01-1.5 0v-.01c0-.026-.037-.088-.15-.161a2.1 2.1 0 00-.6-.283V9.25a4.56 4.56 0 011.388.533c.533.346.862.86.862 1.467s-.329 1.12-.862 1.467a4.558 4.558 0 01-1.388.533v.5a.75.75 0 01-1.5 0v-.5a3.592 3.592 0 01-1.5-.554c-.456-.297-.75-.714-.75-1.216v-.01a.75.75 0 011.5 0v.01c0 .026.037.088.15.161.18.117.42.218.6.283V10.75a4.56 4.56 0 01-1.388-.533C6.579 9.87 6.25 9.357 6.25 8.75s.329-1.12.862-1.467A4.558 4.558 0 018.5 6.75v-.5z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      name="agenciaDigito"
                      value={form.agenciaDigito}
                      onChange={handleChange}
                      placeholder="ex.: 1234-5"
                      required
                      className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-4 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Conta + Dígito <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path d="M10.75 10.818v2.614A3.13 3.13 0 0011.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 00-1.138-.432zM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 00-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.627-.514.909 0 .184.058.39.33.615z" />
                        <path fillRule="evenodd" d="M9.99 1.75C5.44 1.75 1.75 5.44 1.75 9.99c0 4.551 3.69 8.24 8.24 8.24 4.551 0 8.24-3.689 8.24-8.24 0-4.55-3.689-8.24-8.24-8.24zm-.75 3.5a.75.75 0 011.5 0v.73a3.592 3.592 0 011.5.554c.456.297.75.714.75 1.216v.01a.75.75 0 01-1.5 0v-.01c0-.026-.037-.088-.15-.161a2.1 2.1 0 00-.6-.283V9.25a4.56 4.56 0 011.388.533c.533.346.862.86.862 1.467s-.329 1.12-.862 1.467a4.558 4.558 0 01-1.388.533v.5a.75.75 0 01-1.5 0v-.5a3.592 3.592 0 01-1.5-.554c-.456-.297-.75-.714-.75-1.216v-.01a.75.75 0 011.5 0v.01c0 .026.037.088.15.161.18.117.42.218.6.283V10.75a4.56 4.56 0 01-1.388-.533C6.579 9.87 6.25 9.357 6.25 8.75s.329-1.12.862-1.467A4.558 4.558 0 018.5 6.75v-.5z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      name="contaDigito"
                      value={form.contaDigito}
                      onChange={handleChange}
                      placeholder="ex.: 12345678-9"
                      required
                      className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-4 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            <div>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#4F46E5] text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                    <path fillRule="evenodd" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z" clipRule="evenodd" />
                  </svg>
                </span>
                Segurança
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
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
                      required
                      className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-10 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
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
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
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
                      placeholder="Repita sua senha"
                      required
                      className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-10 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
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
                </div>

                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-600">
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
                      required
                      className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-4 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                    />
                  </div>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-400">
                Mínimo de 8 caracteres com letras e números
              </p>
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#4F46E5] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4338CA] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:ring-offset-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              Concluir Cadastro
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-gray-400">
            Ao se cadastrar, você concorda com nossos{" "}
            <a href="#" className="text-[#4F46E5] hover:underline">
              Termos de Uso
            </a>{" "}
            e{" "}
            <a href="#" className="text-[#4F46E5] hover:underline">
              Política de Privacidade
            </a>
          </p>
        </div>

        <p className="mt-5 text-center text-sm text-gray-500">
          Já tem uma conta?{" "}
          <a href="#" className="font-medium text-[#4F46E5] hover:underline">
            Entre aqui
          </a>
        </p>
      </div>
    </main>
  );
}
