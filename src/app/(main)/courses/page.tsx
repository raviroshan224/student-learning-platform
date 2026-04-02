"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Radio, Play, Clock, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/constants/routes";
import { EnrollmentsService } from "@/services/api/enrollments.service";
import { LiveService } from "@/services/api/live.service";
import { resolveImageUrl, computeLiveClassStatus, getExpiryLabel } from "@/lib/utils/course";
import toast from "react-hot-toast";

// ─── Circular Progress ────────────────────────────────────────────────────────
function CircularProgress({ value }: { value: number }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value));
  const dash = (pct / 100) * circ;
  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg className="rotate-[-90deg]" width="56" height="56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="var(--color-gray-300, #D4D9DF)" strokeWidth="5" />
        <circle
          cx="28" cy="28" r={r} fill="none"
          stroke="#1E3A5F"
          strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-bold text-[#1E3A5F]">{pct}%</span>
      </div>
    </div>
  );
}

// ─── Live Class Status Badge ──────────────────────────────────────────────────
function LiveStatusBadge({ status }: { status: string }) {
  if (status === "Live now") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary-600)]/90 text-white text-[10px] font-semibold px-2 py-0.5">
        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
        Live now
      </span>
    );
  }
  if (status === "Starts soon") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 text-white text-[10px] font-semibold px-2 py-0.5">
        Starts soon
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-gray-500/80 text-white text-[10px] font-semibold px-2 py-0.5">
      Completed
    </span>
  );
}

// ─── My Courses Tab ───────────────────────────────────────────────────────────
function MyCoursesTab() {
  const { data: enrollmentsRaw, isLoading } = useQuery({
    queryKey: ["my-enrollments"],
    queryFn: () => EnrollmentsService.myCourses().then((r) =>
      Array.isArray(r.data) ? r.data : (r.data as any)?.data ?? []
    ),
    staleTime: 1000 * 60 * 2,
  });
  const enrollments: any[] = enrollmentsRaw ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-[var(--radius-md)]" />
        ))}
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="py-20 text-center text-[var(--muted-foreground)]">
        <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium">You have not enrolled in any courses yet.</p>
        <p className="text-sm mt-1">Explore courses to get started</p>
        <Link href={ROUTES.EXPLORE} className="mt-4 inline-block">
          <Button size="sm">Explore Courses</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {enrollments.map((enrollment: any) => {
        const course = enrollment.course ?? {};
        const progress = enrollment.progress ?? {};
        const pct = Math.min(100, Math.max(0, progress.progressPercentage ?? 0));
        const img = resolveImageUrl(course.courseIconUrl ?? course.courseImageUrl);
        const expiryLabel = getExpiryLabel(enrollment.expiryDate);
        const enrollDate = enrollment.enrollmentDate ?? enrollment.enrolledAt;

        return (
          <Link key={enrollment.id} href={ROUTES.COURSE_DETAIL(course.id ?? enrollment.courseId)}>
            <div className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] hover:shadow-md transition-shadow cursor-pointer">
              {/* Thumbnail 74×74 */}
              <div className="h-[74px] w-[74px] shrink-0 rounded-lg overflow-hidden bg-[var(--color-primary-600)] flex items-center justify-center">
                {img ? (
                  <Image src={img} alt={course.courseTitle ?? "Course"} width={74} height={74} className="object-cover h-full w-full" />
                ) : (
                  <BookOpen className="h-7 w-7 text-white" />
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm line-clamp-2 leading-snug">{course.courseTitle}</p>
                {enrollDate && (
                  <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                    Enrolled: {new Date(enrollDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                )}
                {expiryLabel && (
                  <p className={`text-[11px] mt-0.5 ${expiryLabel === "Expired" ? "text-red-500" : "text-[var(--muted-foreground)]"}`}>
                    {expiryLabel}
                  </p>
                )}
              </div>
              {/* Circular progress (only when > 0) */}
              {pct > 0 && <CircularProgress value={pct} />}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ─── Ongoing Classes Tab ──────────────────────────────────────────────────────
function OngoingClassesTab() {
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const { data: classesRaw, isLoading } = useQuery({
    queryKey: ["my-live-classes-ongoing"],
    queryFn: () => LiveService.myClasses({ status: "ongoing", limit: 20 }).then((r) =>
      Array.isArray(r.data) ? r.data : (r.data as any)?.data ?? []
    ),
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 30, // refresh every 30s to update live status
  });
  const classes: any[] = classesRaw ?? [];

  async function handleJoin(lc: any) {
    setJoiningId(lc.id);
    try {
      const res = await LiveService.joinToken(lc.id);
      const url = (res.data as any)?.meetingUrl ?? lc.meetingUrl;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      else toast.error("No meeting link available.");
    } catch {
      if (lc.meetingUrl) window.open(lc.meetingUrl, "_blank", "noopener,noreferrer");
      else toast.error("Unable to join class. Please try again.");
    } finally {
      setJoiningId(null);
    }
  }

  function formatSchedule(lc: any): string {
    const start = lc.startTime ?? lc.scheduledAt;
    const end = lc.endTime;
    if (!start) return "";
    const s = new Date(start);
    const sStr = s.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    if (!end) return sStr;
    const e = new Date(end);
    // Same day?
    if (s.toDateString() === e.toDateString()) {
      return `${sStr} – ${e.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    }
    return `${sStr} – ${e.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`;
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-[var(--radius-md)]" />
        ))}
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="py-20 text-center text-[var(--muted-foreground)]">
        <Radio className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium">No live classes scheduled</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-28">
      {classes.map((lc: any) => {
        const { isJoinable, displayStatus } = computeLiveClassStatus(lc);
        const img = resolveImageUrl(lc.thumbnailUrl ?? lc.bannerImageUrl);
        const schedule = formatSchedule(lc);
        const instructor = lc.lecturerName ?? lc.instructorName;
        const instructorImg = resolveImageUrl(lc.lecturerImageUrl);
        const isJoining = joiningId === lc.id;

        return (
          <div key={lc.id} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            {/* Banner image 180px */}
            <div className="relative h-[180px] bg-gradient-to-br from-[var(--color-primary-600)] to-[var(--color-primary-500)]">
              {img ? (
                <Image src={img} alt={lc.title} fill sizes="100vw" className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Radio className="h-12 w-12 text-white/40" />
                </div>
              )}
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/20" />
              {/* Status badge top-left */}
              <div className="absolute top-3 left-3">
                <LiveStatusBadge status={displayStatus} />
              </div>
              {/* Join button bottom-right */}
              {isJoinable && (
                <div className="absolute bottom-3 right-3">
                  <button
                    onClick={() => handleJoin(lc)}
                    disabled={isJoining}
                    className="bg-[#2A5D9F] text-white text-xs font-semibold px-5 py-2 rounded-lg hover:bg-[#1E4A80] transition-colors disabled:opacity-60"
                  >
                    {isJoining ? "Joining..." : "Join Now"}
                  </button>
                </div>
              )}
            </div>
            {/* Info below */}
            <div className="p-3 space-y-1.5">
              {(lc.subjectName ?? lc.courseTitle) && (
                <p className="text-[11px] text-[var(--muted-foreground)]">{lc.subjectName ?? lc.courseTitle}</p>
              )}
              <p className="font-semibold text-sm line-clamp-2">{lc.title}</p>
              {schedule && (
                <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                  <Clock className="h-3 w-3 shrink-0" />
                  {schedule}
                </div>
              )}
              {instructor && (
                <div className="flex items-center gap-1.5">
                  <div className="h-5 w-5 rounded-full bg-[var(--color-primary-100)] overflow-hidden flex items-center justify-center shrink-0">
                    {instructorImg ? (
                      <Image src={instructorImg} alt={instructor} width={20} height={20} className="object-cover" />
                    ) : (
                      <span className="text-[9px] font-bold text-[var(--color-primary-600)]">
                        {instructor.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[var(--muted-foreground)]">{instructor}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CoursesPage() {
  const [tab, setTab] = useState<0 | 1>(0);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-[var(--foreground)]">Courses Enrolled</h1>

      {/* Two-pill tab switcher */}
      <div className="flex gap-2 p-1 rounded-[var(--radius-lg)] bg-[var(--muted)]">
        {(["My Courses", "Ongoing Classes"] as const).map((label, i) => (
          <button
            key={i}
            onClick={() => setTab(i as 0 | 1)}
            className={`flex-1 py-2 rounded-[var(--radius-md)] text-sm font-semibold transition-all duration-200 ${
              tab === i
                ? "bg-[#1E3A5F] text-white shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 0 ? <MyCoursesTab /> : <OngoingClassesTab />}
    </div>
  );
}
