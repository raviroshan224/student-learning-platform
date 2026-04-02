"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, BookOpen, GraduationCap, Radio, CreditCard, Trophy, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { NotificationsService } from "@/services/api/notifications.service";
import toast from "react-hot-toast";

const typeIconMap: Record<string, React.ElementType> = {
  live_class: Radio,
  exam_reminder: GraduationCap,
  course_update: BookOpen,
  achievement: Trophy,
  payment: CreditCard,
  system: Bell,
};

const typeColorMap: Record<string, string> = {
  live_class: "bg-red-50 text-red-600",
  exam_reminder: "bg-purple-50 text-purple-600",
  course_update: "bg-blue-50 text-blue-600",
  achievement: "bg-yellow-50 text-yellow-600",
  payment: "bg-green-50 text-green-600",
  system: "bg-[var(--muted)] text-[var(--muted-foreground)]",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const { data: notificationsRaw, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () =>
      NotificationsService.getAll().then((r) => {
        const d = r.data as any;
        return Array.isArray(d) ? d : d?.data ?? [];
      }),
  });

  const notifications: any[] = notificationsRaw ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markReadMutation = useMutation({
    mutationFn: (id: string) => NotificationsService.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => NotificationsService.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All marked as read");
    },
  });

  const filtered = notifications.filter((n) => filter === "all" || !n.isRead);

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--foreground)]">Notifications</h1>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="gap-2 text-xs"
          >
            <Check className="h-3.5 w-3.5" /> Mark all read
          </Button>
        )}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
              filter === f
                ? "bg-[var(--color-primary-600)] text-white"
                : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--border)]"
            )}
          >
            {f === "all" ? "All" : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
          </button>
        ))}
      </div>

      <Card>
        {isLoading ? (
          <div className="divide-y divide-[var(--border)]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 p-4">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <CardContent className="py-12 text-center">
            <Bell className="mx-auto h-8 w-8 text-[var(--muted-foreground)] mb-2 opacity-30" />
            <p className="text-sm text-[var(--muted-foreground)]">No notifications</p>
          </CardContent>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {filtered.map((notification) => {
              const type = notification.type ?? "system";
              const Icon = typeIconMap[type] ?? Bell;
              const colorClass = typeColorMap[type] ?? typeColorMap.system;
              return (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-4 p-4 transition-colors hover:bg-[var(--muted)]/50 cursor-pointer",
                    !notification.isRead && "bg-[var(--color-primary-50)]"
                  )}
                  onClick={() => {
                    if (!notification.isRead) markReadMutation.mutate(notification.id);
                  }}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                      colorClass
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          !notification.isRead && "text-[var(--color-primary-700)]"
                        )}
                      >
                        {notification.title}
                      </p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-[var(--muted-foreground)]">
                          {notification.createdAt ? timeAgo(notification.createdAt) : ""}
                        </span>
                        {!notification.isRead && (
                          <div className="h-2 w-2 rounded-full bg-[var(--color-primary-600)]" />
                        )}
                      </div>
                    </div>
                    {notification.message && (
                      <p className="text-xs text-[var(--muted-foreground)] mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
