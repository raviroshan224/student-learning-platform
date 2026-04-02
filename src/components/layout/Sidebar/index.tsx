"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Compass, BookOpen, ClipboardList,
  Bell, User, Radio, ChevronLeft, ChevronRight,
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
  { href: ROUTES.EXAMS, icon: ClipboardList, label: "Mock Tests" },
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
      <div className="flex h-[var(--topbar-height)] items-center px-4 border-b border-[var(--border)]">
        {!sidebarCollapsed && (
          <Link href={ROUTES.DASHBOARD} className="text-xl font-bold text-[var(--color-primary-600)]">
            {CONFIG.APP_NAME}
          </Link>
        )}
        {sidebarCollapsed && (
          <div className="mx-auto h-8 w-8 rounded-full bg-[var(--color-primary-600)] text-white flex items-center justify-center font-bold text-sm">
            L
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--color-primary-50)] text-[var(--color-primary-700)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              )}
              title={sidebarCollapsed ? label : undefined}
            >
              <Icon className={cn("h-5 w-5 shrink-0", active && "text-[var(--color-primary-600)]")} />
              {!sidebarCollapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User + Collapse Toggle */}
      <div className="border-t border-[var(--border)] p-3 space-y-2">
        {!sidebarCollapsed && user && (
          <div className="flex items-center gap-3 px-1 py-1">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar} />
              <AvatarFallback>{user?.name?.slice(0, 2).toUpperCase() ?? "ST"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-[var(--muted-foreground)] truncate">{user?.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => collapseSidebar(!sidebarCollapsed)}
          className="flex w-full items-center justify-center gap-2 rounded-[var(--radius)] px-3 py-2 text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
