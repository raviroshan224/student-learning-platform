import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { CONFIG } from "@/lib/constants/config";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-primary-50)] flex flex-col">
      <header className="flex h-16 items-center px-6 border-b border-[var(--border)] bg-white">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-[var(--color-primary-600)] flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-[var(--foreground)]">
            Scholar<span className="text-[var(--color-primary-600)]">Gyan</span>
          </span>
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-[480px]">
          {children}
        </div>
      </main>
    </div>
  );
}
