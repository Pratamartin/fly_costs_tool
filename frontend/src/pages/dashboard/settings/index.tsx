import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useTheme } from "next-themes";
import AdminSidebar from "@/components/AdminSidebar";
import CoordinatorSidebar from "@/components/CoordinatorSidebar";
import StudentSidebar from "@/components/StudentSidebar";
import { getMe, type UserProfile } from "@/services/user";
import { getToken } from "@/lib/getToken";
import { performLogout } from "@/lib/logout";
import { useAuthStore } from "@/store/authStore";

type ThemeOption = "light" | "dark" | "system";

const THEME_OPTIONS: { value: ThemeOption; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: "light",
    label: "Claro",
    description: "Fundo branco, ideal para ambientes iluminados.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.06l1.06-1.06zM6.464 14.596a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.596 15.657a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.06 1.06l1.06 1.061zM5.404 6.464a.75.75 0 001.06-1.06L5.404 4.343a.75.75 0 00-1.06 1.06l1.06 1.061z" />
      </svg>
    ),
  },
  {
    value: "dark",
    label: "Escuro",
    description: "Fundo escuro, reduz o cansaço visual à noite.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path fillRule="evenodd" d="M7.455 2.004a.75.75 0 01.26.77 7 7 0 009.958 7.967.75.75 0 011.067.853A8.5 8.5 0 116.647 1.921a.75.75 0 01.808.083z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    value: "system",
    label: "Sistema",
    description: "Segue a preferência do seu sistema operacional.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path fillRule="evenodd" d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5zm1.5 0a.75.75 0 01.75-.75h11.5a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75H4.25a.75.75 0 01-.75-.75v-7.5z" clipRule="evenodd" />
      </svg>
    ),
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    getMe(token).then((result) => {
      if (result.ok) {
        setUserProfile(result.data);
      } else {
        useAuthStore.getState().clearToken();
        localStorage.removeItem("accessToken");
        router.push("/login");
      }
    }).finally(() => setCarregando(false));
  }, [router]);

  async function handleLogout() {
    await performLogout(router);
  }

  if (carregando || !userProfile) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <svg className="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  const sidebar =
    userProfile.role === "ADMIN" ? (
      <AdminSidebar active="settings" userName={userProfile.name} />
    ) : userProfile.role === "COORDENADOR" ? (
      <CoordinatorSidebar active={null} userName={userProfile.name} onLogout={handleLogout} />
    ) : (
      <StudentSidebar userName={userProfile.name} onLogout={handleLogout} />
    );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {sidebar}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4 dark:border-gray-700 dark:bg-gray-900">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">Configurações</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Preferências do sistema</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
          <div className="mx-auto max-w-2xl space-y-6">

            {/* Tema */}
            <section className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-800">
                <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">Aparência</h2>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Escolha o tema visual da aplicação.</p>
              </div>
              <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-3">
                {THEME_OPTIONS.map((opt) => {
                  const active = theme === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setTheme(opt.value)}
                      className={`flex flex-col items-start gap-3 rounded-xl border-2 p-4 text-left transition ${
                        active
                          ? "border-[#4F46E5] bg-[#4F46E5]/5 dark:bg-[#4F46E5]/10"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 dark:hover:bg-gray-700"
                      }`}
                    >
                      <span className={active ? "text-[#4F46E5]" : "text-gray-500 dark:text-gray-400"}>
                        {opt.icon}
                      </span>
                      <div>
                        <p className={`text-sm font-semibold ${active ? "text-[#4F46E5]" : "text-gray-800 dark:text-gray-100"}`}>
                          {opt.label}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{opt.description}</p>
                      </div>
                      {active && (
                        <span className="ml-auto self-start">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-[#4F46E5]">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}
