"use client";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Bell, Search, BookOpen, Clock, ChevronRight, Play, Award,
  AlertCircle, User as UserIcon
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/constants/routes";
import { useAuth } from "@/hooks/useAuth";
import { HomepageService } from "@/services/api/homepage.service";
import { LiveService } from "@/services/api/live.service";
import { LiveClassCard } from "@/components/live/LiveClassCard";
import toast from "react-hot-toast";

function resolveImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return `https://olp-uploads.s3.us-east-1.amazonaws.com/${url.startsWith("/") ? url.slice(1) : url}`;
}

function formatCountdown(examDate?: string): string {
  if (!examDate) return "";
  const diff = new Date(examDate).getTime() - Date.now();
  if (diff <= 0) return "Exam passed";
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days === 1) return "Tomorrow";
  return `${days} days remaining`;
}

function formatClassTime(scheduledAt: string): string {
  return new Date(scheduledAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function isLiveNow(scheduledAt: string, durationMinutes: number): boolean {
  const now = Date.now();
  const start = new Date(scheduledAt).getTime();
  const end = start + durationMinutes * 60 * 1000;
  return now >= start && now <= end;
}

// ─── Banner Slider ────────────────────────────────────────────────────────────
function BannerSlider({ banners }: { banners: any[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setCurrent((c) => (c + 1) % banners.length), 4000);
    return () => clearInterval(t);
  }, [banners.length]);

  if (banners.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-lg)]" style={{ aspectRatio: "16/9" }}>
      {banners.map((banner, i) => {
        const img = resolveImageUrl(banner.courseImageUrl ?? banner.imageUrl);
        const href = (banner.id ?? banner.courseId) ? ROUTES.COURSE_DETAIL(banner.id ?? banner.courseId) : undefined;
        const inner = (
          <div
            className={`absolute inset-0 transition-opacity duration-500 ${i === current ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          >
            {img ? (
              <Image src={img} alt={banner.title ?? ""} fill sizes="100vw" className="object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-r from-[var(--color-primary-600)] to-[var(--secondary)] flex items-center justify-center">
                <BookOpen className="h-12 w-12 text-white/60" />
              </div>
            )}
            {(banner.courseTitle ?? banner.title) && (
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <p className="text-white font-bold text-sm">{banner.courseTitle ?? banner.title}</p>
                {(banner.categoryName ?? banner.description) && (
                  <p className="text-white/80 text-xs mt-0.5 line-clamp-1">{banner.categoryName ?? banner.description}</p>
                )}
              </div>
            )}
          </div>
        );
        return href ? (
          <Link key={banner.id ?? i} href={href}>{inner}</Link>
        ) : (
          <div key={banner.id ?? i}>{inner}</div>
        );
      })}
      {banners.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all ${i === current ? "w-4 bg-white" : "w-1.5 bg-white/50"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, href, linkLabel = "See All" }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-semibold text-[var(--foreground)]">{title}</h2>
      {href && (
        <Link href={href} className="flex items-center gap-0.5 text-xs font-medium text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] transition-colors">
          {linkLabel} <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

// ─── Course Card ──────────────────────────────────────────────────────────────
function CourseCard({ course, className }: { course: any; className?: string }) {
  const img = resolveImageUrl(course.courseImageUrl);
  const free = !course.enrollmentCost || course.enrollmentCost === 0;
  const price = course.hasOffer && course.discountedPrice
    ? `Rs ${course.discountedPrice.toLocaleString()}`
    : free ? "Free" : `Rs ${course.enrollmentCost?.toLocaleString()}`;

  return (
    <Link href={ROUTES.COURSE_DETAIL(course.id)} className={`block group ${className ?? ""}`}>
      <div className="rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--card)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full flex flex-col">
        <div className="relative bg-gradient-to-br from-[var(--color-primary-600)] to-[var(--color-primary-500)] overflow-hidden" style={{ aspectRatio: "16/9" }}>
          {img ? (
            <Image src={img} alt={course.courseTitle} fill sizes="(max-width: 640px) 160px, (max-width: 1024px) 200px, 240px" className="object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-white/60" />
            </div>
          )}
          {course.hasOffer && course.discountedPrice != null && (
            <div className="absolute top-2 left-2">
              <span className="text-[9px] font-bold bg-[var(--color-warning)] text-white px-1.5 py-0.5 rounded-full">OFFER</span>
            </div>
          )}
          {free && (
            <div className="absolute top-2 right-2">
              <span className="text-[9px] font-bold bg-[var(--color-success)] text-white px-1.5 py-0.5 rounded-full">FREE</span>
            </div>
          )}
        </div>
        <div className="p-3 flex-1 flex flex-col gap-1.5">
          <p className="text-xs font-semibold line-clamp-2 leading-snug text-[var(--foreground)]">
            {course.courseTitle}
          </p>
          <p className={`text-xs font-bold mt-auto ${free ? "text-[var(--color-success)]" : "text-[var(--color-primary-600)]"}`}>
            {price}
          </p>
        </div>
      </div>
    </Link>
  );
}

// (local LiveClassCard removed in favor of shared component)

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [updatingCategoryId, setUpdatingCategoryId] = useState<string | null>(null);

  const { data: homepage, isLoading, error } = useQuery({
    queryKey: ["homepage"],
    queryFn: () => HomepageService.get().then((r) => r.data),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const { data: upcomingClassesData } = useQuery({
    queryKey: ["live-classes-upcoming"],
    queryFn: () => LiveService.myClasses({ status: "upcoming", limit: 5 }).then((r) =>
      Array.isArray(r.data) ? r.data : (r.data as any)?.data ?? []
    ),
    staleTime: 1000 * 60 * 2,
    retry: false,
  });

  const firstName = user?.fullName?.split(" ")[0] ?? user?.name?.split(" ")[0] ?? "Student";
  const avatarUrl = resolveImageUrl(user?.avatar ?? user?.photo?.path);

  const hp = homepage as any;
  const banners: any[] = hp?.bannerCourses ?? hp?.banners ?? [];
  const recommendedCourses: any[] = hp?.recommendedCourses ?? [];
  const latestOngoing = hp?.latestOngoingCourse;
  const upcomingClasses: any[] = Array.isArray(upcomingClassesData) ? upcomingClassesData : [];
  const liveClasses: any[] = hp?.liveClasses ?? [];
  const upcomingExam = hp?.upcomingExam;
  const preferredCategories: any[] = hp?.preferredCategories ?? [];
  // topCategoryWithCourses is an object { categoryId, categoryName, courses: [] }
  const topCat = hp?.topCategoryWithCourses;
  const dealCourses: any[] = hp?.offers ?? topCat?.courses ?? hp?.dealCourses ?? [];

  async function handleCategorySelect(categoryId: string) {
    setUpdatingCategoryId(categoryId);
    try {
      await HomepageService.updateLatestCategory(categoryId);
      qc.invalidateQueries({ queryKey: ["homepage"] });
    } catch {
      toast.error("Failed to update category.");
    } finally {
      setUpdatingCategoryId(null);
    }
  }

  return (
    <div className="space-y-8 pb-4">
      {/* 1. Error Banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-[var(--color-danger)] shrink-0" />
          <p className="text-sm text-[var(--color-danger)]">
            Failed to load homepage content. Pull to refresh.
          </p>
        </div>
      )}

      {/* 2. Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--muted-foreground)]">Welcome back</p>
          <h1 className="text-xl font-bold text-[var(--foreground)]">Namaste, {firstName}!</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href={ROUTES.NOTIFICATIONS}>
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--card)] shadow-sm border border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
              <Bell className="h-4 w-4 text-[var(--muted-foreground)]" />
            </button>
          </Link>
          <Link href={ROUTES.PROFILE}>
            <div className="h-9 w-9 rounded-full bg-[var(--color-primary-100)] border-2 border-[var(--color-primary-200)] overflow-hidden flex items-center justify-center hover:ring-2 hover:ring-[var(--color-primary-300)] transition-all">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={firstName} width={36} height={36} className="object-cover" />
              ) : (
                <UserIcon className="h-5 w-5 text-[var(--color-primary-600)]" />
              )}
            </div>
          </Link>
        </div>
      </div>

      {/* 3. Search Bar */}
      <Link href={ROUTES.EXPLORE}>
        <div className="flex items-center gap-3 rounded-xl bg-[var(--card)] border border-[var(--border)] px-4 py-3 shadow-sm cursor-pointer hover:border-[var(--color-primary-300)] hover:shadow-md transition-all">
          <Search className="h-4 w-4 text-[var(--muted-foreground)]" />
          <span className="text-sm text-[var(--muted-foreground)]">Search courses or mock tests...</span>
        </div>
      </Link>

      {/* 4. Banner + Recommended side-by-side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Banner */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <Skeleton className="w-full rounded-xl" style={{ aspectRatio: "16/9" }} />
          ) : banners.length > 0 ? (
            <BannerSlider banners={banners} />
          ) : null}
        </div>

        {/* Recommended Courses — vertical on desktop */}
        {(isLoading || recommendedCourses.length > 0) && (
          <div className="lg:col-span-2 flex flex-col">
            <SectionHeader title="Recommended" href={ROUTES.EXPLORE} />
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-3 flex-1">
                {recommendedCourses.slice(0, 4).map((c: any) => (
                  <Link key={c.id} href={ROUTES.COURSE_DETAIL(c.id)} className="flex items-center gap-3 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:shadow-sm hover:border-[var(--color-primary-200)] transition-all group">
                    <div className="relative h-14 w-20 shrink-0 rounded-lg overflow-hidden bg-[var(--color-primary-100)]">
                      {resolveImageUrl(c.courseImageUrl) ? (
                        <Image src={resolveImageUrl(c.courseImageUrl)!} alt={c.courseTitle} fill sizes="80px" className="object-cover" />
                      ) : <BookOpen className="absolute inset-0 m-auto h-5 w-5 text-[var(--color-primary-400)]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold line-clamp-2 leading-snug group-hover:text-[var(--color-primary-700)] transition-colors">{c.courseTitle}</p>
                      <p className="text-[10px] font-bold mt-1 text-[var(--color-primary-600)]">
                        {!c.enrollmentCost || c.enrollmentCost === 0 ? "Free" : `Rs ${c.enrollmentCost?.toLocaleString()}`}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {/* Mobile horizontal scroll (hidden on lg) */}
            <div className="lg:hidden flex gap-3 overflow-x-auto pb-2 scrollbar-hide mt-0">
              {recommendedCourses.map((c: any) => <CourseCard key={c.id} course={c} className="shrink-0 w-36" />)}
            </div>
          </div>
        )}
      </div>

      {/* 6. Continue Learning */}
      {latestOngoing && (() => {
        const progress = latestOngoing.progressPercentage ?? latestOngoing.progress ?? 0;
        const lectureId = latestOngoing.lastAccessedLectureId ?? latestOngoing.lastLectureId;
        const courseId = latestOngoing.id ?? latestOngoing.courseId;
        const resumeHref = lectureId ? ROUTES.COURSE_LEARN(courseId, lectureId) : ROUTES.COURSE_DETAIL(courseId);
        const img = resolveImageUrl(latestOngoing.courseImageUrl);
        const lastTitle = latestOngoing.lastAccessedLectureTitle ?? latestOngoing.lastLectureTitle;
        const completed = latestOngoing.completedLectures;
        const total = latestOngoing.totalLectures;
        return (
          <div>
            <SectionHeader title="Continue Learning" href={ROUTES.COURSE_DETAIL(courseId)} linkLabel="View Course" />
            <Link href={resumeHref} className="block group">
              <div className="relative rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--card)] hover:shadow-md transition-shadow">
                {/* Blurred background */}
                {img && (
                  <div className="absolute inset-0">
                    <Image src={img} alt="" fill sizes="100vw" className="object-cover scale-110 blur-xl opacity-20" />
                  </div>
                )}
                {/* Top: thumbnail + info */}
                <div className="relative flex gap-4 p-4">
                  {/* Thumbnail */}
                  <div className="relative h-20 w-28 shrink-0 rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-primary-600)]">
                    {img ? (
                      <Image src={img} alt={latestOngoing.courseTitle} fill sizes="112px" className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-white/60" />
                      </div>
                    )}
                    {/* Play overlay on hover */}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="h-8 w-8 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="h-4 w-4 text-[var(--color-primary-600)] ml-0.5" />
                      </div>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <p className="font-bold text-sm leading-snug line-clamp-2 text-[var(--foreground)]">
                        {latestOngoing.courseTitle}
                      </p>
                      {lastTitle && (
                        <p className="text-xs text-[var(--muted-foreground)] mt-1 truncate">
                          Up next: {lastTitle}
                        </p>
                      )}
                    </div>
                    {completed != null && total != null && (
                      <p className="text-[10px] text-[var(--muted-foreground)] mt-1">
                        {completed}/{total} lectures completed
                      </p>
                    )}
                  </div>
                </div>
                {/* Bottom: progress bar */}
                <div className="relative px-4 pb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-medium text-[var(--color-primary-600)]">Your Progress</span>
                    <span className="text-[10px] font-bold text-[var(--color-primary-600)]">{progress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[var(--muted)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-primary-400)] transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        );
      })()}

      {/* 7. Upcoming + Live Classes */}
      {(upcomingClasses.length > 0 || liveClasses.length > 0) && (
        <div>
          <SectionHeader title={liveClasses.length > 0 ? "Live Classes" : "Upcoming Classes"} href={ROUTES.LIVE} />
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:overflow-visible lg:pb-0">
            {(liveClasses.length > 0 ? liveClasses : upcomingClasses).map((lc: any) => (
              <div key={lc.id} className="shrink-0 w-72 lg:w-auto">
                <LiveClassCard lc={lc} showJoin={liveClasses.length > 0} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. Upcoming Exam */}
      {upcomingExam && (() => {
        const examImg = resolveImageUrl((upcomingExam as any).examImageUrl);
        const daysLeft = upcomingExam.examDate
          ? Math.max(0, Math.ceil((new Date(upcomingExam.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : (upcomingExam as any).daysUntilExam ?? null;
        return (
          <div>
            <SectionHeader title="Upcoming Exam" href={ROUTES.EXAMS} linkLabel="View All" />
            <Link href={ROUTES.EXAMS} className="block hover:opacity-95 transition-opacity">
              <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-[var(--color-primary-700)] via-[var(--color-primary-600)] to-[var(--secondary)] shadow-lg">
                <div className="absolute -top-6 -right-6 h-28 w-28 rounded-full bg-white/10" />
                <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/5" />
                <div className="relative p-5 flex items-center gap-4">
                  <div className="shrink-0 h-14 w-14 rounded-xl overflow-hidden bg-white/15 flex items-center justify-center backdrop-blur-sm">
                    {examImg ? (
                      <Image src={examImg} alt={upcomingExam.title} width={56} height={56} className="object-cover" />
                    ) : (
                      <Award className="h-7 w-7 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {(upcomingExam as any).category && (
                      <span className="inline-block text-[10px] font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full mb-1.5">
                        {(upcomingExam as any).category}
                      </span>
                    )}
                    <p className="font-bold text-white text-sm leading-snug line-clamp-2">{upcomingExam.title}</p>
                    {upcomingExam.examDate && (
                      <p className="text-xs text-white/70 mt-1 font-medium">
                        {new Date(upcomingExam.examDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    )}
                  </div>
                  {daysLeft !== null && (
                    <div className="shrink-0 flex flex-col items-center justify-center bg-white/15 rounded-xl px-3 py-2 min-w-[52px] border border-white/20">
                      <span className="text-xl font-black text-white leading-none">{daysLeft}</span>
                      <span className="text-[9px] font-bold text-white/70 mt-0.5 uppercase tracking-wide">{daysLeft === 1 ? "day" : "days"}</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </div>
        );
      })()}

      {/* 9. Preferred Categories */}
      {preferredCategories.length > 0 && (
        <div>
          <SectionHeader title="Preferred Categories" />
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {preferredCategories.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                disabled={updatingCategoryId === cat.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-2 py-3 text-center hover:border-[var(--color-primary-400)] hover:bg-[var(--color-primary-50)] transition-all disabled:opacity-50"
              >
                <p className="text-xs font-medium text-[var(--foreground)] leading-tight line-clamp-2">
                  {cat.categoryName ?? cat.name}
                </p>
                {cat.courseCount != null && (
                  <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">{cat.courseCount} courses</p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 10. Grab the Deals */}
      {dealCourses.length > 0 && (
        <div>
          <SectionHeader
            title="Grab the Deals"
            href={topCat?.categoryId ? `${ROUTES.EXPLORE}?categoryId=${topCat.categoryId}` : ROUTES.EXPLORE}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {dealCourses.slice(0, 10).map((c: any) => <CourseCard key={c.id} course={c} />)}
          </div>
        </div>
      )}
    </div>
  );
}
