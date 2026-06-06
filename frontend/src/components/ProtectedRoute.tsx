import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuthStore } from "@/store/authStore";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { accessToken, setToken, clearToken } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function check() {
      // Already have a valid token in store
      if (accessToken) { setChecking(false); return; }

      // Try to get token from localStorage (page refresh scenario)
      const stored = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      if (stored) {
        setToken(stored);
        setChecking(false);
        return;
      }

      // No token — attempt silent refresh via cookie
      try {
        const res = await axios.post(`${API_URL}/v1/auth/refresh`, {}, { withCredentials: true });
        const token: string = res.data.accessToken;
        localStorage.setItem("accessToken", token);
        setToken(token);
        setChecking(false);
      } catch {
        clearToken();
        localStorage.removeItem("accessToken");
        router.replace("/login");
      }
    }
    check();
  }, [accessToken, setToken, clearToken, router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <svg className="animate-spin h-8 w-8 text-[#2563EB]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return <>{children}</>;
}
