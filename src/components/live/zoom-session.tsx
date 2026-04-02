"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Mic, MicOff, PhoneOff, Users, Wifi, WifiOff } from "lucide-react";

interface ZoomSessionProps {
  token: string;
  sessionName: string;
  userName: string;
  onLeave: () => void;
}

type SessionStatus = "connecting" | "connected" | "error";

export function ZoomSession({ token, sessionName, userName, onLeave }: ZoomSessionProps) {
  const clientRef = useRef<any>(null);
  const videoCanvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<SessionStatus>("connecting");
  const [errorMsg, setErrorMsg] = useState("");
  const [muted, setMuted] = useState(true);
  const [participantCount, setParticipantCount] = useState(0);
  const [hasVideo, setHasVideo] = useState(false);

  const leave = useCallback(async () => {
    try {
      await clientRef.current?.leave();
    } catch { /* ignore */ }
    try {
      const ZoomVideo = (await import("@zoom/videosdk")).default;
      ZoomVideo.destroyClient();
    } catch { /* ignore */ }
    onLeave();
  }, [onLeave]);

  useEffect(() => {
    let mounted = true;

    async function startSession() {
      // Zoom Video SDK requires a secure context (HTTPS or localhost)
      if (typeof window !== "undefined" && !window.isSecureContext) {
        if (mounted) {
          setErrorMsg("Live classes require a secure connection (HTTPS). Please use the deployed app or open https://localhost:3000 in your browser.");
          setStatus("error");
        }
        return;
      }

      try {
        const ZoomVideo = (await import("@zoom/videosdk")).default;
        const client = ZoomVideo.createClient();
        clientRef.current = client;

        // CDN mode avoids bundling WASM/workers in Next.js
        await client.init("en-US", "CDN", { patchJsMedia: true });
        await client.join(sessionName, token, userName);

        if (!mounted) { await client.leave(); return; }
        setStatus("connected");

        const stream = client.getMediaStream();

        // Start audio as muted listener — lets student hear others
        try {
          await stream.startAudio();
          await stream.muteAudio();
        } catch (audioErr) {
          console.warn("[Zoom] Audio start failed:", audioErr);
        }

        const updateCount = () => {
          if (!mounted) return;
          setParticipantCount(client.getAllUser?.()?.length ?? 0);
        };

        // Render video when a participant starts their camera
        const handleVideoChange = async (payload: any) => {
          if (!videoCanvasRef.current || !mounted) return;
          if (payload.action === "Start") {
            setHasVideo(true);
            try {
              await stream.renderVideo(
                videoCanvasRef.current,
                payload.userId,
                videoCanvasRef.current.clientWidth || 1280,
                videoCanvasRef.current.clientHeight || 720,
                0, 0,
                3 // VideoQuality.Video_720P
              );
            } catch (e) {
              console.warn("[Zoom] renderVideo failed:", e);
            }
          } else if (payload.action === "Stop") {
            try {
              await stream.stopRenderVideo(videoCanvasRef.current, payload.userId);
            } catch { /* ignore */ }
            // Check if any participant still has video
            const stillHasVideo = client.getAllUser?.()?.some((u: any) => u.bVideoOn);
            if (mounted) setHasVideo(!!stillHasVideo);
          }
        };

        client.on("peer-video-state-change", handleVideoChange);
        client.on("user-added", updateCount);
        client.on("user-removed", updateCount);
        updateCount();

        // Render video for anyone already streaming when we join
        const existingUsers = client.getAllUser?.() ?? [];
        for (const u of existingUsers) {
          if (u.bVideoOn) {
            handleVideoChange({ action: "Start", userId: u.userId });
          }
        }
      } catch (err: any) {
        console.error("[Zoom] Session join failed:", err);
        if (mounted) {
          setErrorMsg(err?.message ?? "Failed to join session. Please try again.");
          setStatus("error");
        }
      }
    }

    startSession();
    return () => {
      mounted = false;
      clientRef.current?.leave().catch(() => {});
    };
  }, [token, sessionName, userName]);

  async function toggleMute() {
    const stream = clientRef.current?.getMediaStream();
    if (!stream) return;
    try {
      if (muted) {
        await stream.unmuteAudio();
        setMuted(false);
      } else {
        await stream.muteAudio();
        setMuted(true);
      }
    } catch (e) {
      console.warn("[Zoom] Mute toggle failed:", e);
    }
  }

  // ── Error state ──────────────────────────────────────────────────────────────
  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center bg-black text-white">
        <WifiOff className="h-12 w-12 text-red-400" />
        <p className="font-semibold text-red-300">{errorMsg}</p>
        <button
          onClick={onLeave}
          className="mt-2 px-6 py-2 rounded-full border border-white/30 text-sm hover:bg-white/10 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  // ── Connecting state ─────────────────────────────────────────────────────────
  if (status === "connecting") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 bg-gray-950 text-white">
        <div className="relative">
          <div className="animate-spin h-10 w-10 border-2 border-green-500 border-t-transparent rounded-full" />
        </div>
        <div className="text-center">
          <p className="font-medium text-sm">Joining session…</p>
          <p className="text-xs text-white/50 mt-1">{sessionName}</p>
        </div>
      </div>
    );
  }

  // ── Connected ────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full bg-gray-950 flex flex-col">
      {/* Video canvas */}
      <div className="flex-1 relative">
        <canvas
          ref={videoCanvasRef}
          className="w-full h-full object-contain"
          width={1280}
          height={720}
        />
        {!hasVideo && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40 gap-3">
            <Wifi className="h-12 w-12" />
            <p className="text-sm">Waiting for video to start…</p>
          </div>
        )}
      </div>

      {/* Session info bar */}
      <div className="bg-gray-900 px-4 py-2 flex items-center justify-between text-white/60 text-xs">
        <span className="truncate max-w-[60%]">{sessionName}</span>
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          <span>{participantCount}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-black px-6 py-4 flex items-center justify-center gap-8">
        <button
          onClick={toggleMute}
          className={`flex flex-col items-center gap-1 transition-colors ${muted ? "text-white/40" : "text-white"}`}
        >
          {muted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          <span className="text-[10px]">{muted ? "Unmute" : "Mute"}</span>
        </button>

        <button
          onClick={leave}
          className="flex flex-col items-center gap-1"
        >
          <span className="bg-red-500 hover:bg-red-600 text-white h-12 w-12 rounded-full flex items-center justify-center transition-colors">
            <PhoneOff className="h-5 w-5" />
          </span>
          <span className="text-[10px] text-white/60">Leave</span>
        </button>
      </div>
    </div>
  );
}
