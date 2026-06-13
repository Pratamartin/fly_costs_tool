export function getToken(): string {
  if (typeof window === "undefined") return "";
  return window.__authToken ?? localStorage.getItem("accessToken") ?? "";
}
