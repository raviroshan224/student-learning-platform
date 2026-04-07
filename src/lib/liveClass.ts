import { LiveService } from "@/services/api/live.service";
import toast from "react-hot-toast";

/**
 * Centralized logic to join a live class.
 * 1. Checks for join token/permission.
 * 2. Navigates to the meeting page or opens the join URL.
 */
export async function joinLiveClass(classId: string, router: any) {
  try {
    // We call joinToken to check if the session is available and get credentials.
    // This also acts as a "can join" check.
    const res = await LiveService.joinToken(classId);
    const data = (res.data as any)?.data ?? res.data;

    // If the API provides a direct joinUrl and we're not using the internal player,
    // we could open it in a new tab. But for this app, we navigate to the internal
    // session page which uses the Zoom Video SDK.
    if (data?.joinUrl && !data?.token) {
        // Fallback for non-SDK meetings if any
        window.open(data.joinUrl, "_blank", "noopener,noreferrer");
        return;
    }

    // Standard flow: Navigate to the internal meeting page
    router.push(`/live/${classId}`);
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to join live class. Please try again.";
    toast.error(message);
    console.error("Join Live Class Error:", error);
  }
}
