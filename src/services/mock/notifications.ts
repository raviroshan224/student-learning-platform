import { MOCK_NOTIFICATIONS } from "./data";

export const mockNotificationsService = {
  async getAll() {
    await new Promise((r) => setTimeout(r, 250));
    return [...MOCK_NOTIFICATIONS];
  },

  async getUnreadCount() {
    return MOCK_NOTIFICATIONS.filter((n) => !n.isRead).length;
  },

  async markRead(id: string) {
    const n = MOCK_NOTIFICATIONS.find((n) => n.id === id);
    if (n) n.isRead = true;
  },

  async markAllRead() {
    MOCK_NOTIFICATIONS.forEach((n) => (n.isRead = true));
  },
};
