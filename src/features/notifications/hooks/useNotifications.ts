import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NotificationsService } from "@/services/api/notifications.service";
import { useNotificationStore } from "@/stores/notification.store";
import { queryKeys } from "@/services/query/keys";

export function useNotifications(type?: string) {
  return useQuery({
    queryKey: queryKeys.notifications.all(type),
    queryFn: () => NotificationsService.getAll({ type }).then((r) => r.data),
  });
}

export function useUnreadCount() {
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: async () => {
      const res = await NotificationsService.getUnreadCount();
      setUnreadCount(res.data.data.count);
      return res.data.data.count;
    },
    refetchInterval: 30_000, // poll every 30s
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  const decrementUnread = useNotificationStore((s) => s.decrementUnread);
  return useMutation({
    mutationFn: (id: string) => NotificationsService.markRead(id),
    onSuccess: () => {
      decrementUnread();
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  const clearUnread = useNotificationStore((s) => s.clearUnread);
  return useMutation({
    mutationFn: () => NotificationsService.markAllRead(),
    onSuccess: () => {
      clearUnread();
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() });
    },
  });
}
