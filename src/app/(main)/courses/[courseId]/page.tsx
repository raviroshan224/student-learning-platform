"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen, Play, Clock, Download, FileText, Users, ChevronDown, ChevronUp,
  Lock, Award, CheckCircle, Radio, AlertCircle, ArrowLeft,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/constants/routes";
import { CoursesService } from "@/services/api/courses.service";
import { EnrollmentsService } from "@/services/api/enrollments.service";
import { LiveService } from "@/services/api/live.service";
import { useAuth } from "@/hooks/useAuth";
import {
  resolveImageUrl, getCourseIsEnrolled, getEnrollCTA, getExpiryLabel,
  groupLecturesBySubject, formatDurationSeconds, computeLiveClassStatus,
  normalizeHasOffer,
} from "@/lib/utils/course";
import type { SubjectModel, LectureModel, LecturerModel, CourseMaterialModel, MockTestModel, CourseDetailsResponse } from "@/types/models/course";
import toast from "react-hot-toast";

const TABS = ["Syllabus", "Materials", "Lectures", "Live Classes", "Mock Tests", "Lecturers"] as const;
type TabName = typeof TABS[number];

// ─── helpers ─────────────────────────────────────────────────────────────────
function extractArr(raw: unknown): any[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const r = raw as any;
    if (Array.isArray(r.data)) return r.data;
  }
  return [];
}

// ─── Syllabus Tab ─────────────────────────────────────────────────────────────
function SyllabusTab({ subjects }: { subjects: SubjectModel[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(subjects[0]?.id ?? null);
  const [chapterSheet, setChapterSheet] = useState<any | null>(null);

  if (subjects.length === 0) {
    return <EmptyTab icon={<BookOpen />} message="No syllabus available yet." />;
  }

  return (
    <div className="space-y-2">
      {subjects.map((subject, idx) => {
        const isOpen = expandedId === subject.id;
        const chapters = subject.chapters ?? [];
        const name = subject.subjectName ?? subject.subjectTitle ?? `Subject ${idx + 1}`;
        return (
          <div
            key={subject.id}
            className={`rounded-[var(--radius-md)] overflow-hidden border transition-all duration-300 ${
              isOpen ? "border-[var(--color-primary-600)] shadow-sm" : "border-[var(--border)]"
            } bg-[var(--card)]`}
          >
            <button
              onClick={() => setExpandedId(isOpen ? null : subject.id)}
              className="flex items-center justify-between w-full px-4 py-3 text-left"
            >
              <div className="flex items-center gap-3">
                <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                  isOpen ? "bg-[var(--color-primary-600)] text-white" : "bg-[var(--color-primary-600)]/10 text-[var(--color-primary-600)]"
                }`}>
                  {idx + 1}
                </span>
                <p className="font-bold text-sm">{name}</p>
              </div>
              <div className="flex items-center gap-2">
                {chapters.length > 0 && (
                  <span className="text-[10px] text-[var(--muted-foreground)]">{chapters.length} ch.</span>
                )}
                {subject.markWeight != null && (
                  <span className="text-[10px] text-[var(--color-success)]">{subject.markWeight} marks</span>
                )}
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-[var(--muted-foreground)]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)]" />
                )}
              </div>
            </button>
            {isOpen && (
              <div>
                {subject.subjectDescription && (
                  <p className="px-4 pb-2 text-xs text-[var(--muted-foreground)] line-clamp-3">
                    {subject.subjectDescription}
                  </p>
                )}
                {chapters.length > 0 ? (
                  <div className="divide-y divide-[var(--border)]">
                    {chapters.map((ch, chIdx) => (
                      <button
                        key={ch.id ?? `ch-${chIdx}`}
                        onClick={() => setChapterSheet(ch)}
                        className="flex items-center gap-3 w-full px-4 py-2.5 bg-[var(--background)] hover:bg-[var(--muted)] transition-colors text-left"
                      >
                        <span className="h-7 w-7 rounded-full bg-[var(--muted)] flex items-center justify-center text-[11px] font-bold shrink-0">
                          {ch.chapterNumber ?? "·"}
                        </span>
                        <span className="flex-1 text-sm">{ch.chapterTitle}</span>
                        <ChevronDown className="h-3.5 w-3.5 rotate-[-90deg] text-[var(--muted-foreground)]" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="px-4 pb-3 text-xs text-[var(--muted-foreground)]">No chapters.</p>
                )}
              </div>
            )}
          </div>
        );
      })}
      {/* Chapter description sheet */}
      {chapterSheet && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setChapterSheet(null)}>
          <div
            className="w-full bg-[var(--card)] rounded-t-2xl p-6 shadow-2xl max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-8 h-1 bg-[var(--muted)] rounded-full mx-auto mb-4" />
            <p className="font-bold text-base mb-2">{chapterSheet.chapterTitle}</p>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
              {chapterSheet.chapterDescription ?? "No description available."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Materials Tab ────────────────────────────────────────────────────────────
function MaterialsTab({ courseId, isEnrolled }: { courseId: string; isEnrolled: boolean }) {
  const { data: raw, isLoading } = useQuery({
    queryKey: ["materials", courseId],
    queryFn: () => CoursesService.materials(courseId).then((r) => extractArr(r.data)),
    staleTime: 1000 * 60 * 5,
  });
  const materials: CourseMaterialModel[] = raw ?? [];
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  async function handleDownload(mat: CourseMaterialModel) {
    setDownloadingId(mat.id);
    try {
      const res = await CoursesService.downloadMaterial(mat.id);
      const url = (res.data as any)?.url ?? mat.downloadUrl ?? mat.fileUrl;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      else toast.error("Download link not available.");
    } catch {
      toast.error("Failed to get download link.");
    } finally {
      setDownloadingId(null);
    }
  }

  if (!isEnrolled) return <EnrollWall />;
  if (isLoading) return <TabSkeleton />;
  if (materials.length === 0) return <EmptyTab icon={<FileText />} message="No materials available." />;

  return (
    <div className="space-y-2">
      {materials.map((mat) => {
        const title = mat.materialTitle ?? mat.title ?? "Material";
        const ext = mat.fileExtension ?? mat.materialType ?? "";
        const size = mat.fileSize ? `${(mat.fileSize / 1024).toFixed(0)} KB` : "";
        return (
          <div key={mat.id} className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)]">
            <div className="h-10 w-10 rounded-lg bg-[var(--color-primary-600)]/10 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-[var(--color-primary-600)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{title}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                {[ext.toUpperCase(), size, mat.downloadCount ? `${mat.downloadCount} downloads` : ""].filter(Boolean).join(" · ")}
              </p>
            </div>
            <button
              onClick={() => handleDownload(mat)}
              disabled={downloadingId === mat.id}
              className="h-8 w-8 rounded-full border border-[var(--border)] flex items-center justify-center hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Lectures Tab ─────────────────────────────────────────────────────────────
function LecturesTab({ courseId, subjects, isEnrolled }: { courseId: string; subjects: SubjectModel[]; isEnrolled: boolean }) {
  const [openGroupIdx, setOpenGroupIdx] = useState<number | null>(0);
  const [lectureSheet, setLectureSheet] = useState<LectureModel | null>(null);
  const [watchingId, setWatchingId] = useState<string | null>(null);
  const router = useRouter();

  // Load all lectures for each subject
  const { data: lecturesBySubjectMap, isLoading } = useQuery({
    queryKey: ["all-lectures", courseId],
    queryFn: async () => {
      if (subjects.length === 0) return {};
      const results = await Promise.all(
        subjects.map((s) =>
          CoursesService.lecturesBySubject(s.id)
            .then((r) => ({ subjectId: s.id, lectures: extractArr(r.data) }))
            .catch(() => ({ subjectId: s.id, lectures: [] }))
        )
      );
      const map: Record<string, LectureModel[]> = {};
      results.forEach(({ subjectId, lectures }) => { map[subjectId] = lectures; });
      return map;
    },
    enabled: subjects.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  // Flatten all lectures for grouping
  const allLectures: LectureModel[] = Object.values(lecturesBySubjectMap ?? {}).flat();
  const groups = groupLecturesBySubject(allLectures, subjects);

  async function openLecture(lecture: LectureModel) {
    if (!isEnrolled && !lecture.isFree) return;
    setWatchingId(lecture.id);
    try {
      const res = await CoursesService.watchLecture(lecture.id);
      const body = res.data as any;
      const url = body?.data?.videoUrl ?? body?.data?.url ?? body?.videoUrl ?? body?.url;
      router.push(ROUTES.COURSE_LEARN(courseId, lecture.id) + (url ? `?url=${encodeURIComponent(url)}` : ""));
    } catch {
      toast.error("Failed to load lecture.");
    } finally {
      setWatchingId(null);
    }
  }

  if (!isEnrolled) return <EnrollWall />;
  if (isLoading) return <TabSkeleton />;
  if (groups.length === 0) return <EmptyTab icon={<Play />} message="No lectures available yet." />;

  return (
    <div className="space-y-3">
      {groups.map((group, gi) => {
        const isOpen = openGroupIdx === gi;
        return (
          <div key={gi} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <button
              onClick={() => setOpenGroupIdx(isOpen ? null : gi)}
              className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-[var(--muted)] transition-colors"
            >
              <p className="font-semibold text-sm">{group.title}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--muted-foreground)]">{group.lectures.length} lectures</span>
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </button>
            {isOpen && (
              <div className="grid grid-cols-2 gap-2 p-3">
                {group.lectures.map((lec) => {
                  const thumb = resolveImageUrl(lec.coverImageUrl ?? lec.thumbnailUrl);
                  const name = lec.name ?? lec.lectureTitle ?? "Lecture";
                  const canPlay = isEnrolled || lec.isFree;
                  const dur = formatDurationSeconds(lec.durationSeconds);
                  return (
                    <button
                      key={lec.id}
                      onClick={() => canPlay ? setLectureSheet(lec) : undefined}
                      className="text-left rounded-[var(--radius-md)] overflow-hidden border border-[var(--border)] bg-[var(--background)] hover:shadow-sm transition-shadow"
                    >
                      {/* Top 60% */}
                      <div className="relative aspect-video bg-[var(--color-primary-600)]/8 flex items-center justify-center overflow-hidden">
                        {thumb ? (
                          <Image src={thumb} alt={name} fill sizes="50vw" className="object-cover" />
                        ) : (
                          <Play className="h-7 w-7 text-[var(--color-primary-600)]/50" />
                        )}
                        {!canPlay && (
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <Lock className="h-5 w-5 text-white" />
                          </div>
                        )}
                        {lec.isFree && (
                          <div className="absolute top-1 left-1">
                            <span className="text-[9px] font-bold bg-[var(--color-success)] text-white px-1.5 py-0.5 rounded-full">FREE</span>
                          </div>
                        )}
                      </div>
                      {/* Bottom 40% */}
                      <div className="p-2 space-y-1">
                        <p className="text-[11px] font-semibold line-clamp-2 leading-snug">{name}</p>
                        <div className="flex items-center justify-between">
                          {lec.lecturerName ? (
                            <div className="flex items-center gap-1">
                              <span className="h-4 w-4 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center text-[8px] font-bold text-[var(--color-primary-600)]">
                                {lec.lecturerName.charAt(0).toUpperCase()}
                              </span>
                              <span className="text-[10px] text-[var(--muted-foreground)] truncate max-w-[60px]">{lec.lecturerName}</span>
                            </div>
                          ) : <span />}
                          {canPlay ? (
                            <Play className="h-3 w-3 text-[var(--color-primary-600)]" />
                          ) : (
                            <Lock className="h-3 w-3 text-gray-400" />
                          )}
                        </div>
                        {dur && <p className="text-[10px] text-[var(--muted-foreground)]">{dur}</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Lecture detail bottom sheet */}
      {lectureSheet && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setLectureSheet(null)}>
          <div
            className="w-full bg-[var(--card)] rounded-t-2xl p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-8 h-1 bg-[var(--muted)] rounded-full mx-auto mb-4" />
            {resolveImageUrl(lectureSheet.coverImageUrl ?? lectureSheet.thumbnailUrl) && (
              <div className="relative rounded-[var(--radius-md)] overflow-hidden mb-3" style={{ aspectRatio: "16/9" }}>
                <Image
                  src={resolveImageUrl(lectureSheet.coverImageUrl ?? lectureSheet.thumbnailUrl)!}
                  alt=""
                  fill
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
            )}
            <p className="font-bold text-base mb-1">{lectureSheet.name ?? lectureSheet.lectureTitle}</p>
            {lectureSheet.description && (
              <p className="text-sm text-[var(--muted-foreground)] mb-3">{lectureSheet.description}</p>
            )}
            {formatDurationSeconds(lectureSheet.durationSeconds) && (
              <p className="text-xs text-[var(--muted-foreground)] mb-3 flex items-center gap-1">
                <Clock className="h-3 w-3" /> {formatDurationSeconds(lectureSheet.durationSeconds)}
              </p>
            )}
            <Button
              className="w-full gap-2"
              onClick={() => { openLecture(lectureSheet); setLectureSheet(null); }}
              loading={watchingId === lectureSheet.id}
            >
              <Play className="h-4 w-4" /> Watch Lecture
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Live Classes Tab ─────────────────────────────────────────────────────────
function LiveClassesTab({ courseId }: { courseId: string }) {
  const router = useRouter();
  const { data: raw, isLoading } = useQuery({
    queryKey: ["live-classes-course", courseId],
    queryFn: () => LiveService.myClasses({ courseId, limit: 20 }).then((r) => extractArr(r.data)),
    staleTime: 1000 * 60,
  });
  const classes: any[] = raw ?? [];

  if (isLoading) return <TabSkeleton />;
  if (classes.length === 0) return <EmptyTab icon={<Radio />} message="No live classes for this course." />;

  return (
    <div className="space-y-3">
      {classes.map((lc: any) => {
        const { isJoinable, displayStatus } = computeLiveClassStatus(lc);
        const img = resolveImageUrl(lc.thumbnailUrl ?? lc.bannerImageUrl);
        const start = lc.startTime ?? lc.scheduledAt;
        return (
          <div key={lc.id} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            {img && (
              <div className="relative h-36">
                <Image src={img} alt={lc.title} fill sizes="100vw" className="object-cover" />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute top-2 left-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    displayStatus === "Live now" ? "bg-[var(--color-primary-600)]/90 text-white" :
                    displayStatus === "Starts soon" ? "bg-amber-500/90 text-white" :
                    "bg-gray-500/80 text-white"
                  }`}>{displayStatus}</span>
                </div>
              </div>
            )}
            <div className="p-3 space-y-1.5">
              <p className="font-semibold text-sm">{lc.title}</p>
              {start && (
                <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                  <Clock className="h-3 w-3" />
                  {new Date(start).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </div>
              )}
              {(lc.lecturerName ?? lc.instructorName) && (
                <p className="text-xs text-[var(--muted-foreground)]">{lc.lecturerName ?? lc.instructorName}</p>
              )}
              {isJoinable && (
                <Button size="sm" className="w-full mt-1 gap-1" onClick={() => router.push(`/live/${lc.id}`)}>
                  <Radio className="h-3 w-3" /> Join Now
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Mock Tests Tab ───────────────────────────────────────────────────────────
function MockTestsTab({ courseId, isEnrolled }: { courseId: string; isEnrolled: boolean }) {
  const { data: raw, isLoading } = useQuery({
    queryKey: ["mock-tests", courseId],
    queryFn: () => CoursesService.mockTests(courseId).then((r) => extractArr(r.data)),
    staleTime: 1000 * 60 * 5,
  });
  const tests: MockTestModel[] = raw ?? [];

  if (!isEnrolled) return <EnrollWall />;
  if (isLoading) return <TabSkeleton />;
  if (tests.length === 0) return <EmptyTab icon={<Award />} message="No mock tests available." />;

  return (
    <div className="space-y-3">
      {tests.map((test) => {
        const qCount = test.numberOfQuestions
          ?? test.subjectDistribution?.reduce((s, x) => s + x.numberOfQuestions, 0)
          ?? null;
        const dur = test.durationText ?? (test.durationMinutes ? `${test.durationMinutes} min` : null);
        return (
          <div key={test.id} className="p-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)]">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{test.title}</p>
                {test.description && (
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5 line-clamp-2">{test.description}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {qCount != null && (
                    <span className="text-[10px] bg-[var(--muted)] px-2 py-0.5 rounded-full">{qCount} questions</span>
                  )}
                  {dur && (
                    <span className="text-[10px] bg-[var(--muted)] px-2 py-0.5 rounded-full">{dur}</span>
                  )}
                  {test.attemptsAllowed != null && (
                    <span className="text-[10px] bg-[var(--muted)] px-2 py-0.5 rounded-full">{test.attemptsAllowed} attempts</span>
                  )}
                  {test.testType && (
                    <span className="text-[10px] bg-[var(--color-primary-600)]/10 text-[var(--color-primary-600)] px-2 py-0.5 rounded-full capitalize">{test.testType}</span>
                  )}
                </div>
              </div>
              <Button size="sm" variant="outline">Start</Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Lecturers Tab ────────────────────────────────────────────────────────────
function LecturersTab({ courseId }: { courseId: string }) {
  const { data: raw, isLoading } = useQuery({
    queryKey: ["lecturers", courseId],
    queryFn: () => CoursesService.lecturers(courseId).then((r) => extractArr(r.data)),
    staleTime: 1000 * 60 * 10,
  });
  const lecturers: LecturerModel[] = raw ?? [];

  if (isLoading) return <TabSkeleton />;
  if (lecturers.length === 0) return <EmptyTab icon={<Users />} message="No lecturers listed." />;

  return (
    <div className="space-y-3">
      {lecturers.map((lec) => {
        const img = resolveImageUrl(lec.profileImageUrl ?? lec.photo?.path);
        return (
          <div key={lec.id} className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)]">
            <div className="h-14 w-14 rounded-full overflow-hidden bg-[var(--color-primary-100)] flex items-center justify-center shrink-0">
              {img ? (
                <Image src={img} alt={lec.fullName} width={56} height={56} className="object-cover" />
              ) : (
                <span className="text-lg font-bold text-[var(--color-primary-600)]">
                  {lec.fullName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{lec.fullName}</p>
              {lec.subjects && (
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5 line-clamp-1">{lec.subjects}</p>
              )}
              {lec.email && (
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{lec.email}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
function EnrollWall() {
  return (
    <div className="py-12 text-center text-[var(--muted-foreground)]">
      <Lock className="h-10 w-10 mx-auto mb-3 opacity-30" />
      <p className="font-medium">Enroll to access this content</p>
    </div>
  );
}

function EmptyTab({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="py-12 text-center text-[var(--muted-foreground)]">
      <div className="h-10 w-10 mx-auto mb-3 opacity-30">{icon}</div>
      <p className="font-medium">{message}</p>
    </div>
  );
}

function TabSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-[var(--radius-md)]" />)}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CourseDetailPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId;
  const qc = useQueryClient();
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [enrolling, setEnrolling] = useState(false);
  const [loadedTabs, setLoadedTabs] = useState<Set<number>>(new Set([0]));
  const [descExpanded, setDescExpanded] = useState(false);

  // Course detail — unwrap { data: {...} } or { course: {...} } wrapper,
  // then normalise field-name variations the backend may return.
  const { data: detailRaw, isLoading: detailLoading } = useQuery({
    queryKey: ["course-detail", courseId],
    queryFn: () => CoursesService.detail(courseId).then((r) => {
      const body = r.data as any;
      const raw = body?.data ?? body?.course ?? body;
      return {
        ...raw,
        courseDescription: raw.courseDescription ?? raw.description,
        courseImageUrl:    raw.courseImageUrl    ?? raw.imageUrl ?? raw.thumbnailUrl ?? raw.courseImage,
        durationHours:     raw.durationHours     ?? raw.duration,
        validityDays:      raw.validityDays      ?? raw.validity,
      } as CourseDetailsResponse;
    }),
    retry: false,
  });
  const detail = detailRaw as CourseDetailsResponse | null | undefined;

  // Subjects (always load — needed for Syllabus + Lectures tabs)
  const { data: subjectsRaw, isLoading: subjectsLoading } = useQuery({
    queryKey: ["subjects", courseId],
    queryFn: () => CoursesService.subjects(courseId).then((r) => extractArr(r.data)),
    staleTime: 1000 * 60 * 10,
  });
  const subjects: SubjectModel[] = subjectsRaw ?? [];

  // Enrollment via my-courses (no 403 risk)
  const { data: myCoursesRaw } = useQuery({
    queryKey: ["my-courses"],
    queryFn: () => EnrollmentsService.myCourses().then((r) => extractArr(r.data)),
    staleTime: 1000 * 60 * 2,
  });

  const myEnrollment = (myCoursesRaw as any[])?.find?.((e: any) =>
    e.course?.id === courseId || e.courseId === courseId
  );
  const isEnrolled = !!myEnrollment || getCourseIsEnrolled(detail ?? null);
  const enrollCTA = getEnrollCTA(detail ?? null);

  const course = detail as any;
  const coverImg = resolveImageUrl(course?.courseImageUrl ?? course?.courseIconUrl);
  const hasOffer = normalizeHasOffer(course?.hasOffer);
  const displayPrice = hasOffer && course?.discountedPrice != null
    ? course.discountedPrice : course?.enrollmentCost ?? 0;

  function handleTabChange(idx: number) {
    setActiveTab(idx);
    if (!loadedTabs.has(idx)) setLoadedTabs((prev) => new Set([...prev, idx]));
  }

  async function handleFreeEnroll() {
    setEnrolling(true);
    try {
      await EnrollmentsService.enrollFree(courseId);
      toast.success("Enrolled successfully!");
      qc.invalidateQueries({ queryKey: ["my-courses"] });
      qc.invalidateQueries({ queryKey: ["course-detail", courseId] });
    } catch (err: any) {
      const msg = err?.response?.data?.errors?.message ?? err?.response?.data?.message;
      toast.error(msg ?? "Enrollment failed.");
    } finally {
      setEnrolling(false);
    }
  }

  function handleEsewa() {
    const userId = (user as any)?.id;
    if (!userId) {
      toast.error("Please log in to enroll.");
      return;
    }
    const checkoutUrl = new URL("https://scholargyan.onecloudlab.com/payment/checkout");
    checkoutUrl.searchParams.set("type", "course_enrollment");
    checkoutUrl.searchParams.set("referenceId", courseId);
    checkoutUrl.searchParams.set("userId", userId);
    checkoutUrl.searchParams.set("returnUrl", `${window.location.origin}/courses/${courseId}`);
    window.location.href = checkoutUrl.toString();
  }

  if (detailLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-52 w-full rounded-[var(--radius-lg)]" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-20 rounded-full" />)}
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="py-20 text-center text-[var(--muted-foreground)]">
        <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium">Course not found</p>
        <Link href={ROUTES.EXPLORE} className="mt-4 inline-block">
          <Button size="sm">Back to Explore</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-28">
      {/* Header image */}
      <div className="relative -mx-4 -mt-4 h-52 bg-gradient-to-br from-[var(--color-primary-700)] to-[var(--color-primary-500)] overflow-hidden">
        {coverImg && (
          <Image src={coverImg} alt={course.courseTitle ?? ""} fill sizes="100vw" className="object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent" />
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 h-8 w-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        {/* Title */}
        <div className="absolute bottom-0 inset-x-0 p-4">
          {course.categoryName && (
            <Badge className="text-[10px] bg-white/20 text-white border-0 mb-1.5 backdrop-blur-sm">
              {course.categoryName}
            </Badge>
          )}
          <h1 className="text-white font-bold text-xl leading-snug line-clamp-2">{course.courseTitle}</h1>
        </div>
      </div>

      <div className="space-y-5 mt-4">
        {/* Duration row */}
        <div className="flex flex-wrap gap-4 text-sm text-[var(--muted-foreground)]">
          {course.durationHours != null && (
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {course.durationHours}h content</span>
          )}
          {course.validityDays != null && (
            <span className="flex items-center gap-1">
              <Award className="h-4 w-4" />
              {course.validityDays >= 365
                ? `${Math.floor(course.validityDays / 365)} Year validity`
                : `${course.validityDays} Days validity`}
            </span>
          )}
          {course.stats?.totalStudents != null && (
            <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {course.stats.totalStudents} students</span>
          )}
        </div>

        {/* Description */}
        {course.courseDescription && (
          <div>
            <p className={`text-sm text-[var(--muted-foreground)] leading-relaxed ${!descExpanded ? "line-clamp-4" : ""}`}>
              {course.courseDescription}
            </p>
            <button
              onClick={() => setDescExpanded(!descExpanded)}
              className="mt-1 text-xs text-[var(--color-primary-600)] font-medium hover:underline"
            >
              {descExpanded ? "Show less" : "Show more"}
            </button>
          </div>
        )}

        {/* Enrollment overview (enrolled users) */}
        {isEnrolled && (() => {
          const enr = detail?.enrollmentDetails ?? {};
          const prog = myEnrollment?.progress ?? enr.progress;
          const pct = Math.min(100, Math.max(0, prog?.progressPercentage ?? 0));
          const status = (enr as any).status ?? myEnrollment?.status;
          const expiry = (enr as any).expiryDate ?? myEnrollment?.expiryDate;
          const cert = (enr as any).certificate ?? myEnrollment?.certificate;
          return (
            <div className="p-4 rounded-[var(--radius-md)] border border-[var(--color-primary-200)] bg-[var(--color-primary-50)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[var(--color-primary-700)]">Your Progress</span>
                <span className="text-xs font-bold text-[var(--color-primary-700)]">{pct}% Complete</span>
              </div>
              <div className="h-2 bg-[var(--color-gray-200)] rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-[var(--color-primary-600)] rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {status && (
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full capitalize ${
                    status === "active" ? "bg-[var(--color-primary-600)]/12 text-[var(--color-primary-700)]" :
                    status === "completed" ? "bg-[var(--color-success)]/12 text-[var(--color-success)]" :
                    "bg-red-100 text-red-600"
                  }`}>
                    {status}
                  </span>
                )}
                {expiry && <span className="text-[10px] text-[var(--muted-foreground)]">{getExpiryLabel(expiry)}</span>}
                {cert?.issued && (
                  <span className="text-[10px] bg-green-100 text-green-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Certificate Issued
                  </span>
                )}
              </div>
            </div>
          );
        })()}

        {/* Tab chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => handleTabChange(i)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                activeTab === i
                  ? "bg-[#1E3A5F] text-white shadow-sm"
                  : "bg-[var(--color-primary-600)]/10 text-[var(--color-primary-700)]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div>
          {activeTab === 0 && loadedTabs.has(0) && (
            <SyllabusTab subjects={subjects} />
          )}
          {activeTab === 1 && loadedTabs.has(1) && (
            <MaterialsTab courseId={courseId} isEnrolled={isEnrolled} />
          )}
          {activeTab === 2 && loadedTabs.has(2) && (
            <LecturesTab courseId={courseId} subjects={subjects} isEnrolled={isEnrolled} />
          )}
          {activeTab === 3 && loadedTabs.has(3) && (
            <LiveClassesTab courseId={courseId} />
          )}
          {activeTab === 4 && loadedTabs.has(4) && (
            <MockTestsTab courseId={courseId} isEnrolled={isEnrolled} />
          )}
          {activeTab === 5 && loadedTabs.has(5) && (
            <LecturersTab courseId={courseId} />
          )}
        </div>
      </div>

      {/* Enroll CTA — sticky bottom */}
      {!isEnrolled && enrollCTA !== "NONE" && (
        <div className="fixed bottom-16 inset-x-0 z-40 bg-[var(--card)] border-t border-[var(--border)] shadow-lg px-4 py-3 flex items-center gap-3 rounded-tl-2xl rounded-tr-2xl">
          <div className="flex-1">
            <p className="text-xs text-[var(--muted-foreground)]">Enrollment Fee</p>
            {enrollCTA === "FREE_ENROLL" ? (
              <p className="text-lg font-bold text-[var(--color-success)]">Free</p>
            ) : (
              <div className="flex items-baseline gap-1.5">
                <p className="text-lg font-bold">Rs {displayPrice.toLocaleString()}</p>
                {hasOffer && course.enrollmentCost !== displayPrice && (
                  <p className="text-xs text-[var(--muted-foreground)] line-through">
                    Rs {course.enrollmentCost?.toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>
          <Button
            className="px-6 bg-[#2A5D9F] hover:bg-[#1E4A80]"
            onClick={enrollCTA === "FREE_ENROLL" ? handleFreeEnroll : handleEsewa}
            loading={enrolling}
            disabled={enrolling}
          >
            {enrollCTA === "FREE_ENROLL" ? "Enroll Now" : "Pay with eSewa"}
          </Button>
        </div>
      )}
    </div>
  );
}
