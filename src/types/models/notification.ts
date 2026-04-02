export type NotificationType =
  | "course_update"
  | "exam_reminder"
  | "live_class"
  | "payment"
  | "achievement"
  | "system";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}
