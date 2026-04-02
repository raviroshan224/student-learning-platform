"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Compass, BookOpen, ClipboardList, User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants/routes";

const mobileNavItems = [
  { href: ROUTES.DASHBOARD, icon: Home, label: "Home" },
  { href: ROUTES.EXPLORE, icon: Compass, label: "Explore" },
  { href: ROUTES.COURSES, icon: BookOpen, label: "Courses" },
  { href: ROUTES.EXAMS, icon: ClipboardList, label: "Test" },
  { href: ROUTES.PROFILE, icon: User, label: "Profile" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-[var(--border)] bg-[var(--card)] px-2">
      {mobileNavItems.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1 rounded-[var(--radius)] transition-colors",
              active
                ? "text-[var(--color-primary-700)]"
                : "text-[var(--muted-foreground)]"
            )}
          >
            <Icon className={cn("h-5 w-5", active && "stroke-[2.5px]")} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
