import { QueryClient } from "@tanstack/react-query";
import { CONFIG } from "@/lib/constants/config";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: CONFIG.STALE_TIME,
      // Retrying on the client is redundant: the Axios response interceptor
      // already handles token refresh + one automatic retry.  Leaving retry
      // enabled here causes 401 failures to be re-requested 2 extra times,
      // which amplifies the auth loop and wastes network requests.
      retry: false,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
