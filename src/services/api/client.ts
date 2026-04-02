import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { CONFIG } from "@/lib/constants/config";

const client = axios.create({
  baseURL: CONFIG.API_BASE_URL, // "/api/proxy" — same-origin, no CORS
  headers: { "Content-Type": "application/json" },
});

// ─── Request Interceptor ────────────────────────────────────────────────────
client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const { useAuthStore } = require("@/stores/auth.store");
    let token: string | null = useAuthStore.getState().accessToken;
    // Fall back to localStorage on first load after a hard refresh
    if (!token) {
      token = localStorage.getItem("token");
      if (token) useAuthStore.getState().setToken(token);
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ─── Response Interceptor (token refresh) ──────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
}

client.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only attempt refresh for 401s that aren't themselves the refresh call
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes("/auth/refresh")
    ) {
      // If the user was never authenticated, don't redirect to login — just
      // let react-query surface the error so public pages can handle it.
      const { useAuthStore } = require("@/stores/auth.store");
      if (!useAuthStore.getState().accessToken) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return client(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { useAuthStore } = require("@/stores/auth.store");
        const refreshToken: string | null = useAuthStore.getState().refreshToken
          ?? (typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null);

        if (!refreshToken) throw new Error("No refresh token");

        // Use the proxy so this call is also same-origin
        const { data } = await axios.post(
          `${CONFIG.API_BASE_URL}/auth/refresh`,
          {},
          { headers: { Authorization: `Bearer ${refreshToken}` } }
        );

        const newToken: string =
          data.token ?? data.data?.token ?? data.accessToken ?? data.data?.accessToken;

        useAuthStore.getState().setToken(newToken);
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return client(original);
      } catch (err) {
        processQueue(err, null);
        const { useAuthStore } = require("@/stores/auth.store");
        useAuthStore.getState().logout();
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default client;
