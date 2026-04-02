import Link from "next/link";
import { CONFIG } from "@/lib/constants/config";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--muted)] flex flex-col">
      <header className="flex h-16 items-center px-6">
        <Link href="/" className="text-xl font-bold text-[var(--color-primary-600)]">
          {CONFIG.APP_NAME}
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center p-4 pt-8">
        <div className="w-full max-w-2xl">{children}</div>
      </main>
    </div>
  );
}
