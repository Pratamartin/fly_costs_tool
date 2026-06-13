import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { toast } from "./toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export const api = axios.create({
  baseURL: API_URL,
});

// Inject auth token from store (avoids circular import with store)
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.__authToken ?? localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response: 401 → refresh → retry; 4xx/5xx → toast error
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const res = await axios.post(`${API_URL}/v1/auth/refresh`, {}, { withCredentials: true });
        const newToken: string = res.data.accessToken;
        useAuthStore.getState().setToken(newToken);
        if (typeof window !== "undefined") {
          localStorage.setItem("accessToken", newToken);
        }
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        if (typeof window !== "undefined") {
          window.__authToken = undefined;
          localStorage.removeItem("accessToken");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    }

    const status = error.response?.status;
    if (status && status >= 400) {
      const message: string =
        error.response?.data?.message ??
        (status >= 500 ? "Erro interno do servidor. Tente novamente." : "Ocorreu um erro. Tente novamente.");
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

declare global {
  interface Window {
    __authToken?: string;
  }
}
