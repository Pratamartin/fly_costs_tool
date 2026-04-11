import Link from "next/link";

const features = [
  {
    title: "Solicitações Simples",
    description:
      "Alunos submetem despesas acadêmicas em segundos: escolha o projeto, categoria, valor e sugestão de fornecedor.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    ),
    color: "bg-blue-500",
  },
  {
    title: "Aprovação Ágil",
    description:
      "Coordenadores revisam, aprovam ou rejeitam solicitações com um clique, com campo obrigatório de motivo na rejeição.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
      </svg>
    ),
    color: "bg-[#1a5c38]",
  },
  {
    title: "Rastreamento em Tempo Real",
    description:
      "Acompanhe o status de cada solicitação — pendente, aprovada ou rejeitada — com totais atualizados automaticamente.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
      </svg>
    ),
    color: "bg-[#4F46E5]",
  },
];

const roles = [
  {
    role: "Aluno",
    description:
      "Submeta despesas de projetos acadêmicos, acompanhe o status das suas solicitações e veja o histórico de aprovações.",
    accent: "#4F46E5",
    href: "/register-student",
    cta: "Cadastrar como Aluno",
    items: ["Submeter solicitações de despesa", "Acompanhar status em tempo real", "Filtrar por projeto e categoria"],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
        <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
        <path d="M13.06 15.473a48.45 48.45 0 017.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 01-.46.71 47.878 47.878 0 00-8.105 4.342.75.75 0 01-.832 0 47.877 47.877 0 00-8.104-4.342.75.75 0 01-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 016 13.18v1.27a1.5 1.5 0 00-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.729 6.729 0 00.551-1.608 1.5 1.5 0 00.14-2.67v-.645a48.549 48.549 0 013.44 1.668 2.25 2.25 0 002.12 0z" />
      </svg>
    ),
  },
  {
    role: "Coordenador",
    description:
      "Gerencie as solicitações do seu departamento, aprove ou rejeite despesas e mantenha o controle orçamentário dos projetos.",
    accent: "#1a5c38",
    href: "/register-coordinator",
    cta: "Cadastrar como Coordenador",
    items: ["Revisar solicitações pendentes", "Aprovar ou rejeitar com motivo", "Visão consolidada por projeto"],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
        <path fillRule="evenodd" d="M7.5 5.25a3 3 0 013-3h3a3 3 0 013 3V15a.75.75 0 01-.75.75H8.25A.75.75 0 017.5 15V5.25zm3 0a.75.75 0 00-.75.75v.75h3v-.75a.75.75 0 00-.75-.75h-1.5zM7.5 15.75v1.875c0 .621.504 1.125 1.125 1.125h7.5c.621 0 1.125-.504 1.125-1.125V15.75H7.5z" clipRule="evenodd" />
        <path d="M5.25 5.25a.75.75 0 00-.75.75v8.25a.75.75 0 00.75.75H6v-9H5.25zM19.5 6a.75.75 0 00-.75-.75H18v9h.75a.75.75 0 00.75-.75V6z" />
      </svg>
    ),
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e2d3d]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="h-5 w-5">
                <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
                <path d="M13.06 15.473a48.45 48.45 0 017.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 01-.46.71 47.878 47.878 0 00-8.105 4.342.75.75 0 01-.832 0 47.877 47.877 0 00-8.104-4.342.75.75 0 01-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 016 13.18v1.27a1.5 1.5 0 00-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.729 6.729 0 00.551-1.608 1.5 1.5 0 00.14-2.67v-.645a48.549 48.549 0 013.44 1.668 2.25 2.25 0 002.12 0z" />
                <path d="M4.462 19.462c.42-.419.753-.89 1-1.394.453.213.902.434 1.347.661a6.743 6.743 0 01-1.286 1.794.75.75 0 11-1.06-1.06z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-gray-900">SGDA</span>
          </div>
          <Link
            href="/login"
            className="rounded-lg bg-[#2563EB] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1d4ed8] transition"
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#1e2d3d] px-6 py-24">
        {/* Círculos decorativos */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute top-40 -right-10 h-56 w-56 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-white/5" />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-gray-300">
            Sistema de Gestão de Despesas Acadêmicas
          </span>
          <h1 className="mt-6 text-5xl font-bold leading-tight text-white">
            Controle de despesas{" "}
            <span className="text-[#60a5fa]">simples e transparente</span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-gray-400">
            Do pedido do aluno à aprovação do coordenador — tudo em um só lugar, sem papelada.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-lg bg-[#2563EB] px-7 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#1d4ed8] transition"
            >
              Acessar o sistema
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
              </svg>
            </Link>
            <Link
              href="/register-student"
              className="rounded-lg border border-white/20 bg-white/10 px-7 py-3 text-sm font-semibold text-white hover:bg-white/20 transition"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">Tudo que você precisa</h2>
            <p className="mt-3 text-gray-500">
              Fluxo completo de solicitação e aprovação de despesas acadêmicas.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${f.color} text-white`}>
                  {f.icon}
                </div>
                <h3 className="mt-5 text-base font-bold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">Para cada perfil, um portal dedicado</h2>
            <p className="mt-3 text-gray-500">
              Acesso personalizado para alunos e coordenadores.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2">
            {roles.map((r) => (
              <div key={r.role} className="flex flex-col rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
                  style={{ backgroundColor: r.accent }}
                >
                  {r.icon}
                </div>
                <h3 className="mt-5 text-xl font-bold text-gray-900">{r.role}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{r.description}</p>
                <ul className="mt-5 space-y-2">
                  {r.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0" style={{ color: r.accent }}>
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href={r.href}
                  className="mt-8 rounded-lg py-2.5 text-center text-sm font-semibold text-white transition"
                  style={{ backgroundColor: r.accent }}
                >
                  {r.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-gray-50 px-6 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1e2d3d]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="h-4 w-4">
                <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
                <path d="M13.06 15.473a48.45 48.45 0 017.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 01-.46.71 47.878 47.878 0 00-8.105 4.342.75.75 0 01-.832 0 47.877 47.877 0 00-8.104-4.342.75.75 0 01-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 016 13.18v1.27a1.5 1.5 0 00-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.729 6.729 0 00.551-1.608 1.5 1.5 0 00.14-2.67v-.645a48.549 48.549 0 013.44 1.668 2.25 2.25 0 002.12 0z" />
                <path d="M4.462 19.462c.42-.419.753-.89 1-1.394.453.213.902.434 1.347.661a6.743 6.743 0 01-1.286 1.794.75.75 0 11-1.06-1.06z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-gray-700">SGDA</span>
          </div>
          <p className="text-xs text-gray-400">© 2026 Sistema de Gestão de Despesas Acadêmicas</p>
        </div>
      </footer>

    </div>
  );
}
