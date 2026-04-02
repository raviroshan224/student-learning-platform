"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import {
  Radio, Clock, Calendar, User, ArrowLeft, Video,
  CheckCircle, AlertCircle, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LiveService } from "@/services/api/live.service";
import { computeLiveClassStatus, resolveImageUrl } from "@/lib/utils/course";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";

// Load Zoom session only on client — it uses browser-only APIs
const ZoomSession = dynamic(
  () => import("@/components/live/zoom-session").then((m) => m.ZoomSession),
  { ssr: false }
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function resolveStart(lc: any): string | undefined {
  return lc.startTime ?? lc.scheduledAt ?? lc.startsAt ?? lc.scheduledDate;
}
function resolveEnd(lc: any): string | undefined {
  return lc.endTime ?? lc.endsAt;
}
function resolveInstructor(lc: any): string | undefined {
  return lc.lecturerName ?? lc.instructorName ?? lc.lecturer?.fullName;
}
function resolveInstructorAvatar(lc: any): string | undefined {
  return lc.lecturerImageUrl ?? lc.lecturer?.profilePictureUrl ?? lc.lecturer?.profileImageUrl;
}
function resolveBanner(lc: any): string | undefined {
  return lc.bannerImageUrl ?? lc.thumbnailUrl ?? lc.posterUrl ?? lc.imageUrl
    ?? lc.course?.courseImageUrl ?? lc.course?.bannerImage;
}
function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    year: "numeric", hour: "numeric", minute: "2-digit",
  });
}
function durationLabel(lc: any): string | null {
  const mins = lc.durationMinutes ?? lc.duration ?? lc.durationInMinutes;
  if (mins == null) return null;
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ─── Zoom session state ───────────────────────────────────────────────────────
interface SessionCredentials {
  token: string;
  sessionName: string;
  userName: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LiveSessionPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;
  const router = useRouter();

  const [joining, setJoining] = useState(false);
  const [session, setSession] = useState<SessionCredentials | null>(null);

  // Fetch class details — gracefully handle 404/errors
  const { data: lc, isLoading, isError } = useQuery({
    queryKey: ["live-class-detail", sessionId],
    queryFn: async () => {
      const r = await LiveService.getDetail(sessionId);
      const body = r.data as any;
      return body?.data ?? body;
    },
    staleTime: 1000 * 60,
    retry: 1,
  });

  async function handleJoin() {
    setJoining(true);
    try {
      const res = await LiveService.joinToken(sessionId);
      const body = res.data as any;
      const d = body?.data ?? body;

      const token = d?.token;
      const sessionName = d?.sessionName;
      const userName = d?.userName ?? "Student";

      if (token && sessionName) {
        setSession({ token, sessionName, userName });
      } else {
        toast.error("No session credentials returned. Please try again.");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Unable to join. Please try again.";
      toast.error(msg);
    } finally {
      setJoining(false);
    }
  }

  // ── Active Zoom session — full screen ──────────────────────────────────────
  if (session) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <ZoomSession
          token={session.token}
          sessionName={session.sessionName}
          userName={session.userName}
          onLeave={() => setSession(null)}
        />
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-4 pb-10">
        <Skeleton className="h-52 w-full rounded-[var(--radius-lg)]" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-10 w-full rounded-[var(--radius-md)]" />
      </div>
    );
  }

  // ── Error / not found — still show join button ─────────────────────────────
  if (isError || !lc) {
    return (
      <div className="pb-10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-6 hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="py-10 text-center">
          <AlertCircle className="h-10 w-10 mx-auto mb-3 text-[var(--muted-foreground)] opacity-40" />
          <p className="font-medium">Could not load class details</p>
          <p className="text-sm text-[var(--muted-foreground)] mt-1 mb-6">
            You can still try to join if the class is live.
          </p>
          <Button className="gap-2" onClick={handleJoin} loading={joining}>
            <Radio className="h-4 w-4" /> Try to Join Session
          </Button>
        </div>
      </div>
    );
  }

  const { isJoinable, isUpcoming, hasEnded, displayStatus } = computeLiveClassStatus(lc);
  const banner = resolveBanner(lc);
  const bannerResolved = resolveImageUrl(banner);
  const start = resolveStart(lc);
  const end = resolveEnd(lc);
  const instructor = resolveInstructor(lc);
  const instructorAvatar = resolveInstructorAvatar(lc);
  const avatarResolved = resolveImageUrl(instructorAvatar);
  const courseName = lc.courseTitle ?? lc.course?.courseTitle;
  const subjectName = lc.subjectName ?? lc.subject?.subjectName;
  const dur = durationLabel(lc);
  const recordingUrl = lc.recordingUrl;

  const statusColor = isJoinable
    ? "bg-red-500 text-white"
    : isUpcoming
    ? "bg-amber-500 text-white"
    : "bg-gray-400 text-white";

  return (
    <div className="pb-10">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-4 hover:text-[var(--foreground)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Banner */}
      <div className="relative -mx-4 h-48 bg-gradient-to-br from-[var(--color-primary-700)] to-[var(--color-primary-500)] overflow-hidden rounded-[var(--radius-lg)] mb-5">
        {bannerResolved ? (
          <Image src={bannerResolved} alt={lc.title} fill sizes="100vw" className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Radio className="h-16 w-16 text-white/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60" />
        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <span className={`text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${statusColor}`}>
            {isJoinable && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
              </span>
            )}
            {isJoinable ? "LIVE NOW" : displayStatus.toUpperCase()}
          </span>
        </div>
        {/* Title */}
        <div className="absolute bottom-0 inset-x-0 p-4">
          <h1 className="text-white font-bold text-xl leading-snug line-clamp-2">{lc.title}</h1>
          {(courseName || subjectName) && (
            <p className="text-white/70 text-xs mt-1">
              {[courseName, subjectName].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-5">
        {lc.description && (
          <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{lc.description}</p>
        )}

        {/* Info grid */}
        <div className="grid grid-cols-1 gap-3">
          {start && (
            <InfoRow icon={<Calendar className="h-4 w-4" />} label="Starts">
              {formatTime(start)}
            </InfoRow>
          )}
          {end && (
            <InfoRow icon={<Clock className="h-4 w-4" />} label="Ends">
              {formatTime(end)}
            </InfoRow>
          )}
          {dur && (
            <InfoRow icon={<Clock className="h-4 w-4" />} label="Duration">
              {dur}
            </InfoRow>
          )}
          {instructor && (
            <InfoRow
              icon={
                avatarResolved ? (
                  <div className="h-6 w-6 rounded-full overflow-hidden shrink-0">
                    <Image src={avatarResolved} alt={instructor} width={24} height={24} className="object-cover" />
                  </div>
                ) : (
                  <User className="h-4 w-4" />
                )
              }
              label="Instructor"
            >
              {instructor}
            </InfoRow>
          )}
        </div>

        {/* Join button */}
        {isJoinable && (
          <Button
            className="w-full gap-2 bg-red-500 hover:bg-red-600 text-white"
            onClick={handleJoin}
            loading={joining}
          >
            <Radio className="h-4 w-4" />
            Join Live Class
            <ExternalLink className="h-3.5 w-3.5 ml-auto" />
          </Button>
        )}

        {/* Upcoming notice */}
        {isUpcoming && start && (
          <div className="p-4 rounded-[var(--radius-md)] border border-amber-200 bg-amber-50">
            <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0" />
              This class starts on {formatTime(start)}
            </p>
            <p className="text-xs text-amber-700 mt-1">Come back when the class is live to join.</p>
          </div>
        )}

        {/* Ended — recording */}
        {hasEnded && (
          <div className="p-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)]">
            <p className="text-sm font-medium flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-[var(--color-success)]" />
              This class has ended
            </p>
            {recordingUrl ? (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => window.open(recordingUrl, "_blank", "noopener,noreferrer")}
              >
                <Video className="h-4 w-4" /> Watch Recording
              </Button>
            ) : (
              <p className="text-xs text-[var(--muted-foreground)]">Recording will be available soon.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared ────────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)]">
      <span className="text-[var(--color-primary-600)] mt-0.5">{icon}</span>
      <div>
        <p className="text-[11px] text-[var(--muted-foreground)] uppercase tracking-wide font-medium">{label}</p>
        <p className="text-sm font-medium mt-0.5">{children}</p>
      </div>
    </div>
  );
}
