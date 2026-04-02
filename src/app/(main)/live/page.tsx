"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Radio, Clock, Users, Calendar, Video } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/constants/routes";
import { LiveService } from "@/services/api/live.service";
import { computeLiveClassStatus } from "@/lib/utils/course";
import toast from "react-hot-toast";

// ─── helpers ─────────────────────────────────────────────────────────────────
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

// ─── Join handler (no navigation — opens Zoom in new tab) ────────────────────
async function openMeeting(lc: any): Promise<void> {
  let url: string | undefined;
  try {
    const res = await LiveService.joinToken(lc.id);
    const d = res.data as any;
    url = d?.meetingUrl ?? d?.joinUrl;
  } catch {
    // silently fall through to class-level URL
  }
  if (!url) {
    url = lc.joinUrl ?? lc.meetingUrl ?? lc.meeting?.joinUrl ?? lc.meeting?.meetingUrl;
  }
  if (url) {
    window.open(url, "_blank", "noopener,noreferrer");
  } else {
    toast.error("No meeting link available for this class.");
  }
}

// ─── Session Card ─────────────────────────────────────────────────────────────
function SessionCard({ lc }: { lc: any }) {
  const [joining, setJoining] = useState(false);
  const { isJoinable, isUpcoming, hasEnded, displayStatus } = computeLiveClassStatus(lc);
  const start = resolveStart(lc);
  const instructor = resolveInstructor(lc);
  const courseName = lc.courseTitle ?? lc.course?.courseTitle;
  const duration = lc.durationMinutes ?? lc.duration ?? lc.durationInMinutes;

  const badgeStyle =
    isJoinable
      ? "bg-red-500 text-white"
      : isUpcoming
      ? "bg-amber-500 text-white"
      : "bg-gray-400 text-white";

  async function handleJoin() {
    setJoining(true);
    try {
      await openMeeting(lc);
    } finally {
      setJoining(false);
    }
  }

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="py-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-lg)] ${
                isJoinable ? "bg-red-50" : "bg-[var(--muted)]"
              }`}
            >
              <Radio
                className={`h-6 w-6 ${
                  isJoinable ? "text-red-500" : "text-[var(--muted-foreground)]"
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-semibold text-sm">{lc.title}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeStyle}`}>
                  {isJoinable ? "LIVE" : displayStatus}
                </span>
              </div>
              {(instructor || courseName) && (
                <p className="text-xs text-[var(--muted-foreground)]">
                  {[instructor, courseName].filter(Boolean).join(" · ")}
                </p>
              )}
              <div className="flex items-center gap-4 mt-1.5 text-xs text-[var(--muted-foreground)]">
                {start && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(start).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
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

          <div className="shrink-0 flex gap-2">
            {isJoinable && (
              <Button
                size="sm"
                variant="destructive"
                className="gap-2"
                onClick={handleJoin}
                loading={joining}
              >
                <Radio className="h-3.5 w-3.5" /> Join Live
              </Button>
            )}
            {isUpcoming && (
              <Link href={ROUTES.LIVE_SESSION(lc.id)}>
                <Button size="sm" variant="outline">View Details</Button>
              </Link>
            )}
            {hasEnded && (lc.recordingUrl ? (
              <Button
                size="sm"
                variant="ghost"
                className="gap-1"
                onClick={() => window.open(lc.recordingUrl, "_blank", "noopener,noreferrer")}
              >
                <Video className="h-3.5 w-3.5" /> Recording
              </Button>
            ) : (
              <Button size="sm" variant="ghost" disabled>Recording Soon</Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-[var(--radius-md)]" />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LivePage() {
  const { data: raw, isLoading, isError } = useQuery({
    queryKey: ["live-classes-all"],
    queryFn: () => LiveService.myClasses({ limit: 50 }).then((r) => extractArr(r.data)),
    staleTime: 1000 * 60,
  });

  const classes: any[] = raw ?? [];

  // Partition by computed (client-side) status
  const live: any[] = [];
  const upcoming: any[] = [];
  const past: any[] = [];

  classes.forEach((lc) => {
    const { isJoinable, isUpcoming, hasEnded } = computeLiveClassStatus(lc);
    if (isJoinable) live.push(lc);
    else if (isUpcoming) upcoming.push(lc);
    else if (hasEnded) past.push(lc);
    else upcoming.push(lc); // default: treat unknown as upcoming
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Live Classes"
        description="Join live sessions, interact with instructors, and learn in real time."
      />

      {isLoading && <PageSkeleton />}

      {isError && (
        <div className="py-10 text-center text-[var(--muted-foreground)]">
          <p>Failed to load live classes. Please try again.</p>
        </div>
      )}

      {!isLoading && !isError && classes.length === 0 && (
        <div className="py-16 text-center text-[var(--muted-foreground)]">
          <Radio className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No live classes available</p>
          <p className="text-sm mt-1">Check back later or enroll in a course to access live sessions.</p>
        </div>
      )}

      {/* Live Now */}
      {live.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            Live Now
          </h2>
          {live.map((lc) => <SessionCard key={lc.id} lc={lc} />)}
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Upcoming Sessions</h2>
          {upcoming.map((lc) => <SessionCard key={lc.id} lc={lc} />)}
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-[var(--muted-foreground)]">Past Sessions</h2>
          {past.map((lc) => <SessionCard key={lc.id} lc={lc} />)}
        </div>
      )}
    </div>
  );
}
