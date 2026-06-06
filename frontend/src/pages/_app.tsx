import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Toaster } from "sonner";
import { useRouter } from "next/router";
import ProtectedRoute from "@/components/ProtectedRoute";

const PROTECTED_PREFIXES = ["/dashboard"];

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isProtected = PROTECTED_PREFIXES.some((prefix) => router.pathname.startsWith(prefix));

  return (
    <>
      <Toaster position="top-right" richColors closeButton expand={false} />
      {isProtected ? (
        <ProtectedRoute>
          <Component {...pageProps} />
        </ProtectedRoute>
      ) : (
        <Component {...pageProps} />
      )}
    </>
  );
}
