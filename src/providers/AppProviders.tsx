"use client";

import { Toaster } from "react-hot-toast";
import { QueryProvider } from "./QueryProvider";
import { useMe } from "@/features/auth/hooks/useAuthActions";

/**
 * Mounts the /auth/me query once at the app root so every child component
 * can read the cached user without each making its own request.
 *
 * The query is ONLY enabled when an accessToken is present (see useMe),
 * so this component is a no-op on the login / register pages.
 */
function AuthInitializer() {
  useMe();
  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthInitializer />
      {children}

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "var(--card)",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            fontSize: "0.875rem",
          },
          success: { iconTheme: { primary: "#22c55e", secondary: "#fff" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
        }}
      />
    </QueryProvider>
  );
}
