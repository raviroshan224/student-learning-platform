"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Home, Compass, BookOpen, ClipboardList,
  Bell, User, Radio, ChevronLeft, ChevronRight, GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui.store";
import { ROUTES } from "@/lib/constants/routes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { GraduationCap as ExamIcon } from "lucide-react";

const navItems = [
  { href: ROUTES.DASHBOARD, icon: Home, label: "Home" },
  { href: ROUTES.EXPLORE, icon: Compass, label: "Explore" },
  { href: ROUTES.COURSES, icon: BookOpen, label: "Courses" },
  { href: ROUTES.TESTS, icon: ClipboardList, label: "Mock Tests" },
  { href: ROUTES.EXAMS, icon: ExamIcon, label: "Exams" },
  { href: ROUTES.LIVE, icon: Radio, label: "Live Classes" },
  { href: ROUTES.NOTIFICATIONS, icon: Bell, label: "Notifications" },
  { href: ROUTES.PROFILE, icon: User, label: "Profile" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, collapseSidebar } = useUIStore();
  const { user } = useAuth();
  // Defer collapsed state until after mount to avoid SSR/client hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const collapsed = mounted && sidebarCollapsed;

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col h-screen sticky top-0 border-r border-[var(--border)] bg-white transition-all duration-300 shrink-0",
        collapsed
          ? "w-[var(--sidebar-collapsed-width)]"
          : "w-[var(--sidebar-width)]"
      )}
    >
      {/* Logo */}
      <div className="flex h-[var(--topbar-height)] items-center px-4 border-b border-[var(--border)] shrink-0">
        {!collapsed ? (
          <Link href={ROUTES.DASHBOARD} className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[var(--color-primary-600)] flex items-center justify-center shrink-0">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-base font-bold text-[var(--foreground)] leading-tight">
              Scholar<span className="text-[var(--color-primary-600)]">Gyan</span>
            </span>
          </Link>
        ) : (
          <Link href={ROUTES.DASHBOARD} className="mx-auto">
            <div className="h-8 w-8 rounded-lg bg-[var(--color-primary-600)] flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
          </Link>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 rounded-lg",
                active
                  ? "bg-[var(--color-primary-50)] text-[var(--color-primary-600)] font-semibold"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-[var(--color-primary-600)]")} />
              {!collapsed && <span>{label}</span>}
              {!collapsed && active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--color-primary-600)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User + Collapse Toggle */}
      <div className="border-t border-[var(--border)] p-3 space-y-2 shrink-0">
        {!collapsed && user && (
          <Link
            href={ROUTES.PROFILE}
            className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-[var(--color-primary-50)] text-[var(--color-primary-700)] text-xs font-bold">
                {user?.name
                  ? user.name.split(" ").filter(Boolean).map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
                  : "ST"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-[var(--foreground)]">{user?.name}</p>
              <p className="text-xs text-[var(--muted-foreground)] truncate">{user?.email}</p>
            </div>
          </Link>
        )}
        <button
          onClick={() => collapseSidebar(!collapsed)}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          {collapsed
            ? <ChevronRight className="h-4 w-4" />
            : <><ChevronLeft className="h-4 w-4" /><span>Collapse</span></>
          }
        </button>
      </div>
    </aside>
  );
}
