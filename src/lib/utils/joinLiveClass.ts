import { LiveService } from "@/services/api/live.service";
import toast from "react-hot-toast";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

/**
 * Centralized join handler used by every location that shows a "Join" button.
 *
 * Strategy:
 *  1. Navigate to /live/{id} — that page fetches join-token and renders ZoomSession.
 *     This is the cleanest approach because the session page already handles the
 *     full SDK credential flow (token + sessionName → ZoomSession).
 *  2. If the router is not available (e.g. called from outside React), fall back to
 *     window.location.href.
 *
 * The live session detail page (`/live/[sessionId]`) is the single source of truth
 * for the join flow. This avoids duplicating the joinToken + ZoomSession wiring in
 * 4 different components.
 */
export function navigateToLiveSession(id: string, router: AppRouterInstance) {
  router.push(`/live/${id}`);
}

/**
 * Direct join: call join-token API, open ZoomSession inline.
 * Use this when you want to open the session without navigating away.
 * Returns the credentials on success, or null on failure.
 */
export async function fetchJoinCredentials(id: string): Promise<{
  token: string;
  sessionName: string;
  userName: string;
} | null> {
  try {
    const res = await LiveService.joinToken(id);
    const body = res.data as any;
    const d = body?.data ?? body;

    const token: string | undefined = d?.token;
    const sessionName: string | undefined = d?.sessionName;
    const userName: string = d?.userName ?? "Student";

    if (!token || !sessionName) {
      toast.error("No session credentials received. Please try again.");
      return null;
    }

    return { token, sessionName, userName };
  } catch (err: any) {
    const msg =
      err?.response?.data?.errors?.message ??
      err?.response?.data?.message ??
      "Unable to join the class. Please try again.";
    toast.error(msg);
    return null;
  }
}
