import { create } from "zustand";

interface AuthState {
  accessToken: string | null;
  setToken: (token: string) => void;
  clearToken: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  setToken: (token) => {
    if (typeof window !== "undefined") window.__authToken = token;
    set({ accessToken: token });
  },
  clearToken: () => {
    if (typeof window !== "undefined") window.__authToken = undefined;
    set({ accessToken: null });
  },
}));
