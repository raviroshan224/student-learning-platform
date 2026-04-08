"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Radio, Clock, Calendar, Video } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/constants/routes";
import { LiveService } from "@/services/api/live.service";
import { computeLiveClassStatus } from "@/lib/utils/course";
import { joinLiveClass } from "@/lib/liveClass";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

// ─── helpers ──────────────────────────────────────────────────────────────────
function extractArr(raw: unknown): any[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const r = raw as any;
    if (Array.isArray(r.data)) return r.data;
    if (Array.isArray(r.classes)) return r.classes;
  }
  return [];
}

function resolveStart(lc: any): string | undefined {
  return lc.startTime ?? lc.scheduledAt ?? lc.startsAt ?? lc.scheduledDate;
}

function resolveInstructor(lc: any): string | undefined {
  return lc.lecturerName ?? lc.instructorName ?? lc.lecturer?.fullName;
}

// ─── Session Card ──────────────────────────────────────────────────────────────
function SessionCard({ lc }: { lc: any }) {
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const { isJoinable, isUpcoming, hasEnded, displayStatus } = computeLiveClassStatus(lc);
  const start = resolveStart(lc);
  const instructor = resolveInstructor(lc);
  const courseName = lc.courseTitle ?? lc.course?.courseTitle;
  const duration = lc.durationMinutes ?? lc.duration ?? lc.durationInMinutes;

  async function handleJoin() {
    setJoining(true);
    try {
      await joinLiveClass(lc.id, router);
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="bg-white border border-[var(--border)] rounded-xl p-4 hover:border-[var(--color-primary-600)] transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Icon */}
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
            isJoinable
              ? "bg-red-50 border-red-100"
              : isUpcoming
              ? "bg-[var(--color-primary-50)] border-[var(--color-primary-100)]"
              : "bg-[var(--muted)] border-[var(--border)]"
          }`}>
            <Radio className={`h-5 w-5 ${
              isJoinable ? "text-red-500" : isUpcoming ? "text-[var(--color-primary-600)]" : "text-[var(--muted-foreground)]"
            }`} />
          </div>

          <div className="flex-1 min-w-0">
            {/* Title + badges */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-sm text-[var(--foreground)]">{lc.title}</h3>
              {isJoinable && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> LIVE
                </span>
              )}
              {isUpcoming && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-primary-50)] text-[var(--color-primary-600)] border border-[var(--color-primary-100)]">
                  Upcoming
                </span>
              )}
              {hasEnded && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]">
                  Ended
                </span>
              )}
            </div>

            {(instructor || courseName) && (
              <p className="text-xs text-[var(--muted-foreground)] mb-1.5">
                {[instructor, courseName].filter(Boolean).join(" · ")}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
              {start && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(start).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </span>
              )}
              {duration != null && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {duration}m
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="shrink-0 flex gap-2">
          {isJoinable && (
            <Button
              size="sm"
              className="gap-1.5 rounded-lg bg-[var(--color-danger)] hover:bg-red-700 text-white"
              onClick={handleJoin}
              disabled={joining}
            >
              <Radio className="h-3.5 w-3.5" />
              {joining ? "Joining..." : "Join Live"}
            </Button>
          )}
          {isUpcoming && (
            <Link href={ROUTES.LIVE_SESSION(lc.id)}>
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg border-[var(--color-primary-600)] text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)]"
              >
                View Details
              </Button>
            </Link>
          )}
          {hasEnded && (lc.recordingUrl ? (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 rounded-lg"
              onClick={() => window.open(lc.recordingUrl, "_blank", "noopener,noreferrer")}
            >
              <Video className="h-3.5 w-3.5" /> Recording
            </Button>
          ) : (
            <Button size="sm" variant="ghost" disabled className="rounded-lg text-[var(--muted-foreground)]">
              Recording Soon
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-xl" />
      ))}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function LivePage() {
  const { data: raw, isLoading, isError } = useQuery({
    queryKey: ["live-classes-all"],
    queryFn: () => LiveService.myClasses({ limit: 50 }).then((r) => extractArr(r.data)),
    staleTime: 1000 * 60,
  });

  const classes: any[] = raw ?? [];

  const live: any[] = [];
  const upcoming: any[] = [];
  const past: any[] = [];

  classes.forEach((lc) => {
    const { isJoinable, isUpcoming, hasEnded } = computeLiveClassStatus(lc);
    if (isJoinable) live.push(lc);
    else if (isUpcoming) upcoming.push(lc);
    else if (hasEnded) past.push(lc);
    else upcoming.push(lc);
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Live Classes</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Join live sessions, interact with instructors, and learn in real time
        </p>
      </div>

      {isLoading && <PageSkeleton />}

      {isError && (
        <div className="py-10 text-center bg-red-50 rounded-xl border border-red-100">
          <p className="text-sm text-[var(--color-danger)] font-medium">Failed to load live classes. Please try again.</p>
        </div>
      )}

      {!isLoading && !isError && classes.length === 0 && (
        <div className="py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-[var(--color-primary-50)] flex items-center justify-center mx-auto mb-4">
            <Radio className="h-8 w-8 text-[var(--color-primary-600)]/40" />
          </div>
          <p className="font-semibold text-[var(--foreground)]">No live classes available</p>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Check back later or enroll in a course to access live sessions.
          </p>
        </div>
      )}

      {/* Live Now */}
      {live.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-bold flex items-center gap-2 text-[var(--foreground)]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            Live Now
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {live.map((lc) => <SessionCard key={lc.id} lc={lc} />)}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-bold text-[var(--foreground)]">Upcoming Sessions</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {upcoming.map((lc) => <SessionCard key={lc.id} lc={lc} />)}
          </div>
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-bold text-[var(--muted-foreground)]">Past Sessions</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {past.map((lc) => <SessionCard key={lc.id} lc={lc} />)}
          </div>
        </div>
      )}
    </div>
  );
}
