"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Compass, BookOpen, ClipboardList,
  Bell, User, Radio, ChevronLeft, ChevronRight, GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui.store";
import { CONFIG } from "@/lib/constants/config";
import { ROUTES } from "@/lib/constants/routes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { href: ROUTES.DASHBOARD, icon: Home, label: "Home" },
  { href: ROUTES.EXPLORE, icon: Compass, label: "Explore" },
  { href: ROUTES.COURSES, icon: BookOpen, label: "Courses" },
  { href: ROUTES.TESTS, icon: ClipboardList, label: "Mock Tests" },
  { href: ROUTES.EXAMS, icon: GraduationCap, label: "Exams" },
  { href: ROUTES.LIVE, icon: Radio, label: "Live Classes" },
  { href: ROUTES.NOTIFICATIONS, icon: Bell, label: "Notifications" },
  { href: ROUTES.PROFILE, icon: User, label: "Profile" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, collapseSidebar } = useUIStore();
  const { user } = useAuth();

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col h-screen sticky top-0 border-r border-[var(--border)] bg-[var(--card)] transition-all duration-300 shrink-0",
        sidebarCollapsed
          ? "w-[var(--sidebar-collapsed-width)]"
          : "w-[var(--sidebar-width)]"
      )}
    >
      {/* Logo */}
      <div className="flex h-[var(--topbar-height)] items-center px-4 border-b border-[var(--border)] shrink-0">
        {!sidebarCollapsed ? (
          <Link href={ROUTES.DASHBOARD} className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[var(--color-primary-600)] flex items-center justify-center shrink-0">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-base font-bold text-[var(--foreground)] leading-tight">{CONFIG.APP_NAME}</span>
          </Link>
        ) : (
          <div className="mx-auto h-8 w-8 rounded-lg bg-[var(--color-primary-600)] flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                active
                  ? "bg-[var(--color-primary-600)] text-white shadow-sm"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              )}
              title={sidebarCollapsed ? label : undefined}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {!sidebarCollapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User + Collapse Toggle */}
      <div className="border-t border-[var(--border)] p-3 space-y-2 shrink-0">
        {!sidebarCollapsed && user && (
          <Link href={ROUTES.PROFILE} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-[var(--color-primary-100)] text-[var(--color-primary-700)] text-xs font-bold">
                {user?.name?.slice(0, 2).toUpperCase() ?? "ST"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-[var(--muted-foreground)] truncate">{user?.email}</p>
            </div>
          </Link>
        )}
        <button
          onClick={() => collapseSidebar(!sidebarCollapsed)}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
