import Link from "next/link";
import { CONFIG } from "@/lib/constants/config";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <header className="flex h-16 items-center px-6 border-b border-[var(--border)]">
        <Link href="/" className="text-xl font-bold text-[var(--color-primary-600)]">
          {CONFIG.APP_NAME}
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>
    </div>
  );
}
