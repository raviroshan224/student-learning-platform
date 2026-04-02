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
    <header className="sticky top-0 z-40 flex h-[var(--topbar-height)] items-center border-b border-[var(--border)] bg-[var(--card)] px-4 gap-3">
      {/* Spacer */}
      <div className="flex-1" />

      {/* Notifications */}
      <Link href={ROUTES.NOTIFICATIONS}>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-danger)] text-white text-[10px] font-bold",
                unreadCount > 9 && "w-5"
              )}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </Link>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-[var(--radius)] p-1 hover:bg-[var(--muted)] transition-colors">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback>
                {user?.name?.slice(0, 2).toUpperCase() ?? "ST"}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:block text-sm font-medium">
              {user?.name ?? "Student"}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={ROUTES.PROFILE} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => logout()}
            disabled={isLoggingOut}
            className="text-[var(--color-danger)]"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isLoggingOut ? "Logging out…" : "Logout"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
