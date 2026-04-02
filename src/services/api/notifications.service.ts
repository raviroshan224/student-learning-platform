import client from "./client";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { Notification } from "@/types/models/notification";

export const NotificationsService = {
  getAll: (params?: { page?: number; type?: string }) =>
    client.get<PaginatedResponse<Notification>>("/notifications", { params }),

  markRead: (id: string) =>
    client.patch<ApiResponse<null>>(`/notifications/${id}/read`),

  markAllRead: () =>
    client.patch<ApiResponse<null>>("/notifications/read-all"),

  getUnreadCount: () =>
    client.get<ApiResponse<{ count: number }>>("/notifications/unread-count"),
};
