import type { NextRouter } from "next/router";
import { useAuthStore } from "@/store/authStore";
import { logout as logoutApi } from "@/services/auth";

export async function performLogout(router: NextRouter): Promise<void> {
  await logoutApi();
  useAuthStore.getState().clearToken();
  localStorage.removeItem("accessToken");
  router.push("/login");
}
