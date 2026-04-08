"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/constants/routes";
import { EnrollmentsService } from "@/services/api/enrollments.service";
import { LiveService } from "@/services/api/live.service";
import { LiveClassCard } from "@/components/live/LiveClassCard";
import { resolveImageUrl, getExpiryLabel } from "@/lib/utils/course";

// ─── My Courses Tab ────────────────────────────────────────────────────────────
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
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="h-16 w-16 rounded-2xl bg-[var(--color-primary-50)] flex items-center justify-center mx-auto mb-4">
          <BookOpen className="h-8 w-8 text-[var(--color-primary-600)]/40" />
        </div>
        <p className="font-semibold text-[var(--foreground)]">No courses enrolled yet</p>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">Start learning by enrolling in a course</p>
        <Link href={ROUTES.EXPLORE} className="mt-5 inline-block">
          <Button className="bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] rounded-lg">
            Explore Courses
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {enrollments.map((enrollment: any) => {
        const course = enrollment.course ?? {};
        const progress = enrollment.progress ?? {};
        const pct = Math.min(100, Math.max(0, progress.progressPercentage ?? 0));
        const img = resolveImageUrl(course.courseIconUrl ?? course.courseImageUrl);
        const expiryLabel = getExpiryLabel(enrollment.expiryDate);
        const enrollDate = enrollment.enrollmentDate ?? enrollment.enrolledAt;

        return (
          <Link key={enrollment.id} href={ROUTES.COURSE_DETAIL(course.id ?? enrollment.courseId)}>
            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-[var(--border)] bg-white hover:border-[var(--color-primary-600)] transition-colors cursor-pointer group">
              {/* Thumbnail */}
              <div className="h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-[var(--color-primary-50)] flex items-center justify-center">
                {img ? (
                  <Image src={img} alt={course.courseTitle ?? "Course"} width={64} height={64} className="object-cover h-full w-full" />
                ) : (
                  <BookOpen className="h-7 w-7 text-[var(--color-primary-600)]/40" />
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm line-clamp-2 leading-snug group-hover:text-[var(--color-primary-600)] transition-colors">
                  {course.courseTitle}
                </p>
                {enrollDate && (
                  <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                    Enrolled: {new Date(enrollDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                )}
                {expiryLabel && (
                  <p className={`text-[11px] mt-0.5 font-medium ${expiryLabel === "Expired" ? "text-red-500" : "text-[var(--muted-foreground)]"}`}>
                    {expiryLabel}
                  </p>
                )}
                {pct > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-[var(--muted)] overflow-hidden">
                      <div className="h-full rounded-full bg-[var(--color-primary-600)] transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-[var(--color-primary-600)] shrink-0">{pct}%</span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ─── Ongoing Classes Tab ───────────────────────────────────────────────────────
function OngoingClassesTab() {
  const router = useRouter();

  const { data: classesRaw, isLoading } = useQuery({
    queryKey: ["my-live-classes-ongoing"],
    queryFn: () => LiveService.myClasses({ status: "ongoing", limit: 20 }).then((r) =>
      Array.isArray(r.data) ? r.data : (r.data as any)?.data ?? []
    ),
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 30,
  });
  const classes: any[] = classesRaw ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="h-16 w-16 rounded-2xl bg-[var(--color-primary-50)] flex items-center justify-center mx-auto mb-4">
          <Radio className="h-8 w-8 text-[var(--color-primary-600)]/40" />
        </div>
        <p className="font-semibold text-[var(--foreground)]">No live classes scheduled</p>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">Check back later for upcoming sessions</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-28">
      {classes.map((lc: any) => (
        <LiveClassCard key={lc.id} lc={lc} variant="full" />
      ))}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function CoursesPage() {
  const [tab, setTab] = useState<0 | 1>(0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">My Courses</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">Track your enrolled courses and live classes</p>
      </div>

      {/* Tab switcher */}
      <div className="flex bg-[var(--muted)] rounded-xl p-1 gap-1">
        {(["My Courses", "Ongoing Classes"] as const).map((label, i) => (
          <button
            key={i}
            onClick={() => setTab(i as 0 | 1)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              tab === i
                ? "bg-white text-[var(--color-primary-600)] shadow-sm"
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
