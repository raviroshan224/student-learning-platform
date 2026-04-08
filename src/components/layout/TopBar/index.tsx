"use client";

import Link from "next/link";
import { Bell, LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useLogout } from "@/features/auth/hooks/useAuthActions";
import { useNotificationStore } from "@/stores/notification.store";
import { ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";

export function TopBar() {
  const { user } = useAuth();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const { unreadCount } = useNotificationStore();

  return (
    <header className="sticky top-0 z-40 flex h-[var(--topbar-height)] items-center border-b border-[var(--border)] bg-white px-4 gap-3">
      <div className="flex-1" />

      {/* Notifications */}
      <Link href={ROUTES.NOTIFICATIONS}>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-white hover:bg-[var(--muted)] transition-colors">
          <Bell className="h-4 w-4 text-[var(--muted-foreground)]" />
          {unreadCount > 0 && (
            <span
              className={cn(
                "absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-danger)] text-white text-[10px] font-bold",
                unreadCount > 9 && "w-5"
              )}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </Link>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2.5 rounded-lg border border-[var(--border)] px-3 py-1.5 hover:bg-[var(--muted)] transition-colors">
            <Avatar className="h-7 w-7">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="text-xs font-bold bg-[var(--color-primary-50)] text-[var(--color-primary-700)]">
                {user?.name
                  ? user.name.split(" ").filter(Boolean).map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
                  : "ST"}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:block text-sm font-medium text-[var(--foreground)]">
              {user?.name ?? "Student"}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-white border border-[var(--border)] rounded-xl shadow-[var(--shadow-lg)]">
          <DropdownMenuLabel className="text-xs text-[var(--muted-foreground)] font-normal">My Account</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-[var(--border)]" />
          <DropdownMenuItem asChild>
            <Link href={ROUTES.PROFILE} className="cursor-pointer flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-[var(--border)]" />
          <DropdownMenuItem
            onClick={() => logout()}
            disabled={isLoggingOut}
            className="text-[var(--color-danger)] focus:text-[var(--color-danger)] flex items-center gap-2 text-sm cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            {isLoggingOut ? "Logging out…" : "Logout"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
