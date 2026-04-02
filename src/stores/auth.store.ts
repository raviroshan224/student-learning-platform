import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/models/user";

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setRefreshToken: (token: string) => void;
  setAuth: (user: User, accessToken: string, refreshToken?: string) => void;
  updateUser: (partial: Partial<User>) => void;
  logout: () => void;
}

function setAuthCookie() {
  if (typeof document !== "undefined") {
    // 30-day expiry — long enough to survive token refreshes
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `auth_session=1; path=/; expires=${expires}; SameSite=Lax`;
  }
}

function clearAuthCookie() {
  if (typeof document !== "undefined") {
    document.cookie = "auth_session=; path=/; max-age=0; SameSite=Lax";
  }
}

function setCatSelectedCookie() {
  if (typeof document !== "undefined") {
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `cat_selected=1; path=/; expires=${expires}; SameSite=Lax`;
  }
}

function clearCatSelectedCookie() {
  if (typeof document !== "undefined") {
    document.cookie = "cat_selected=; path=/; max-age=0; SameSite=Lax";
  }
}

/** Normalise raw API user → UI-friendly shape (adds aliases) */
export function normaliseUser(raw: User): User {
  return {
    ...raw,
    name: raw.fullName ?? raw.name,           // alias
    avatar: raw.photo?.path ?? raw.avatar,    // alias
    phone: raw.mobileNumber ?? raw.phone,     // alias
  };
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setUser: (user) => set({ user: normaliseUser(user) }),

      setToken: (accessToken) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("token", accessToken);
        }
        setAuthCookie();
        set({ accessToken, isAuthenticated: true });
      },

      setRefreshToken: (refreshToken) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("refreshToken", refreshToken);
        }
        set({ refreshToken });
      },

      setAuth: (user, accessToken, refreshToken) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("token", accessToken);
          if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
        }
        setAuthCookie();
        if (user.hasSelectedCategories) {
          setCatSelectedCookie();
        }
        set({
          user: normaliseUser(user),
          accessToken,
          refreshToken: refreshToken ?? get().refreshToken,
          isAuthenticated: true,
        });
      },

      updateUser: (partial) => {
        const current = get().user;
        if (current) {
          const updated = normaliseUser({ ...current, ...partial });
          if (partial.hasSelectedCategories === true) {
            setCatSelectedCookie();
          }
          set({ user: updated });
        }
      },

      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
        }
        clearAuthCookie();
        clearCatSelectedCookie();
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
