import { create } from "zustand";

interface UIStore {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  activeModal: string | null;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  collapseSidebar: (collapsed: boolean) => void;
  openModal: (id: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: false,
  sidebarCollapsed: false,
  activeModal: null,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  collapseSidebar: (collapsed) => set({ sidebarCollapsed: collapsed }),

  openModal: (id) => set({ activeModal: id }),

  closeModal: () => set({ activeModal: null }),
}));
