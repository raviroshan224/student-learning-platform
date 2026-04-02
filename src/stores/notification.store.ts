import { create } from "zustand";

interface NotificationStore {
  unreadCount: number;
  setUnreadCount: (n: number) => void;
  incrementUnread: () => void;
  decrementUnread: () => void;
  clearUnread: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  unreadCount: 0,
  setUnreadCount: (n) => set({ unreadCount: n }),
  incrementUnread: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),
  decrementUnread: () =>
    set((s) => ({ unreadCount: Math.max(0, s.unreadCount - 1) })),
  clearUnread: () => set({ unreadCount: 0 }),
}));
