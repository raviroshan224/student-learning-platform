"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, CheckCircle, Play, BookOpen, Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/constants/routes";
import { CoursesService } from "@/services/api/courses.service";
import { EnrollmentsService } from "@/services/api/enrollments.service";
import { resolveImageUrl, formatDurationSeconds } from "@/lib/utils/course";
import type { SubjectModel, LectureModel } from "@/types/models/course";
import toast from "react-hot-toast";

// ─── Video Player ─────────────────────────────────────────────────────────────
function VideoPlayer({
  url,
  lectureId,
  onProgress,
}: {
  url?: string | null;
  lectureId: string;
  onProgress: (pct: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  function handleTimeUpdate() {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    onProgress((v.currentTime / v.duration) * 100);
  }

  if (!url) {
    return (
      <div className="bg-black aspect-video w-full flex items-center justify-center">
        <div className="text-center text-white space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
            <Play className="h-7 w-7 fill-white text-white ml-1" />
          </div>
          <p className="text-sm opacity-60">No video available</p>
        </div>
      </div>
    );
  }

  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    return (
      <div className="aspect-video w-full bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  }

  return (
    <div className="aspect-video w-full bg-black">
      <video
        ref={videoRef}
        src={url}
        controls
        className="h-full w-full"
        onTimeUpdate={handleTimeUpdate}
      />
    </div>
  );
}

// ─── Subject Lecture List (sidebar) ──────────────────────────────────────────
function SubjectLectureList({
  subject,
  courseId,
  activeLectureId,
}: {
  subject: SubjectModel;
  courseId: string;
  activeLectureId: string;
}) {
  const { data: lectures, isLoading } = useQuery({
    queryKey: ["lectures", subject.id],
    queryFn: () =>
      CoursesService.lecturesBySubject(subject.id).then((r) =>
        Array.isArray(r.data) ? r.data : (r.data as any)?.data ?? []
      ),
  });
  const list: LectureModel[] = lectures ?? [];

  if (isLoading) {
    return (
      <div className="px-4 py-2 space-y-2">
        {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
      </div>
    );
  }

  return (
    <>
      {list.map((lecture) => {
        const isActive = lecture.id === activeLectureId;
        const name = lecture.name ?? lecture.lectureTitle ?? "Lecture";
        const dur = formatDurationSeconds(lecture.durationSeconds) ||
          (lecture.duration ? `${lecture.duration}m` : "");
        return (
          <Link key={lecture.id} href={ROUTES.COURSE_LEARN(courseId, lecture.id)}>
            <div className={`flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border)] hover:bg-[var(--muted)] transition-colors cursor-pointer ${isActive ? "bg-[var(--color-primary-50)]" : ""}`}>
              <div className="shrink-0">
                {lecture.isCompleted ? (
                  <CheckCircle className="h-4 w-4 text-[var(--color-success)]" />
                ) : (
                  <div className={`h-4 w-4 rounded-full border-2 ${isActive ? "border-[var(--color-primary-600)]" : "border-[var(--muted-foreground)]"}`} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium line-clamp-2 ${isActive ? "text-[var(--color-primary-700)]" : ""}`}>
                  {name}
                </p>
                {dur && <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">{dur}</p>}
              </div>
              {lecture.isFree && !isActive && (
                <span className="text-[9px] bg-[var(--color-success)] text-white px-1 py-0.5 rounded shrink-0">Free</span>
              )}
            </div>
          </Link>
        );
      })}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LecturePage() {
  const params = useParams<{ courseId: string; lectureId: string }>();
  const searchParams = useSearchParams();
  const { courseId, lectureId } = params;
  const qc = useQueryClient();

  // URL may come via search param (from POST /lectures/{id}/watch) or we fetch it here
  const urlFromParam = searchParams.get("url");
  const [videoUrl, setVideoUrl] = useState<string | null>(urlFromParam ?? null);
  const [urlLoading, setUrlLoading] = useState(!urlFromParam);
  const hasMarkedComplete = useRef(false);

  // Fetch watch URL if not passed as param
  useEffect(() => {
    if (urlFromParam) { setVideoUrl(urlFromParam); setUrlLoading(false); return; }
    CoursesService.watchLecture(lectureId)
      .then((res) => setVideoUrl((res.data as any)?.url ?? null))
      .catch(() => setVideoUrl(null))
      .finally(() => setUrlLoading(false));
  }, [lectureId, urlFromParam]);

  // Subjects for sidebar
  const { data: subjectsRaw, isLoading: subjectsLoading } = useQuery({
    queryKey: ["subjects", courseId],
    queryFn: () =>
      CoursesService.subjects(courseId).then((r) =>
        Array.isArray(r.data) ? r.data : (r.data as any)?.data ?? []
      ),
  });
  const subjects: SubjectModel[] = subjectsRaw ?? [];

  // Enrollment progress for sidebar
  const { data: myCoursesRaw } = useQuery({
    queryKey: ["my-courses"],
    queryFn: () => EnrollmentsService.myCourses().then((r) =>
      Array.isArray(r.data) ? r.data : (r.data as any)?.data ?? []
    ),
    staleTime: 1000 * 60 * 2,
  });
  const myEnrollment = (myCoursesRaw as any[])?.find?.((e: any) =>
    e.course?.id === courseId || e.courseId === courseId
  );
  const progress = myEnrollment?.progress;

  // Mark complete at 80%
  const handleProgress = useCallback(
    async (pct: number) => {
      if (pct >= 80 && !hasMarkedComplete.current) {
        hasMarkedComplete.current = true;
        try {
          await CoursesService.completeLecture(lectureId);
          qc.invalidateQueries({ queryKey: ["my-courses"] });
          qc.invalidateQueries({ queryKey: ["all-lectures", courseId] });
        } catch {
          // silent — don't interrupt viewing
        }
      }
    },
    [lectureId, courseId, qc]
  );

  return (
    <div className="flex flex-col lg:flex-row gap-0 -mx-4 -my-6 min-h-[calc(100vh-var(--topbar-height))]">
      {/* Main pane */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Video */}
        {urlLoading ? (
          <Skeleton className="aspect-video w-full" />
        ) : (
          <VideoPlayer url={videoUrl} lectureId={lectureId} onProgress={handleProgress} />
        )}

        {/* Controls */}
        <div className="p-4">
          <Link href={ROUTES.COURSE_DETAIL(courseId)} className="lg:hidden inline-block mb-2">
            <Button variant="outline" size="sm" className="gap-1">
              <ChevronLeft className="h-4 w-4" /> Back to Course
            </Button>
          </Link>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-[var(--border)] bg-[var(--card)] flex flex-col max-h-[60vh] lg:max-h-none overflow-y-auto">
        <div className="p-4 border-b border-[var(--border)] sticky top-0 bg-[var(--card)] z-10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-sm">Course Content</h2>
            {progress && (
              <span className="text-xs text-[var(--muted-foreground)]">
                {progress.completedLecturesCount ?? 0}/{progress.totalLectures ?? 0} done
              </span>
            )}
          </div>
          {progress?.progressPercentage != null && (
            <div className="h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--color-primary-600)] rounded-full"
                style={{ width: `${progress.progressPercentage}%` }}
              />
            </div>
          )}
        </div>

        <div className="overflow-y-auto flex-1">
          {subjectsLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : subjects.length === 0 ? (
            <div className="py-8 text-center text-[var(--muted-foreground)]">
              <BookOpen className="h-6 w-6 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No content available</p>
            </div>
          ) : (
            subjects.map((subject) => (
              <div key={subject.id}>
                <div className="px-4 py-2 bg-[var(--muted)] border-b border-[var(--border)]">
                  <p className="text-xs font-semibold">{subject.subjectName ?? subject.subjectTitle}</p>
                </div>
                <SubjectLectureList subject={subject} courseId={courseId} activeLectureId={lectureId} />
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-[var(--border)] hidden lg:block">
          <Link href={ROUTES.COURSE_DETAIL(courseId)}>
            <Button variant="outline" size="sm" className="w-full gap-1">
              <ChevronLeft className="h-4 w-4" /> Back to Course
            </Button>
          </Link>
        </div>
      </aside>
    </div>
  );
}
