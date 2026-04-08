"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Calendar, ArrowLeft, ClipboardList, Info, ChevronRight, PlayCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExamsService } from "@/services/api/exams.service";
import { ROUTES } from "@/lib/constants/routes";

function resolveImageUrl(url?: string | null): string {
  if (!url) return "/placeholder-exam.jpg";
  if (url.startsWith("http")) return url;
  return `https://olp-uploads.s3.us-east-1.amazonaws.com/${url.startsWith("/") ? url.slice(1) : url}`;
}

export default function ExamDetailPage() {
  const params = useParams<{ examId: string }>();
  const router = useRouter();

  const { data: examData, isLoading } = useQuery({
    queryKey: ["exam-detail", params.examId],
    queryFn: () => ExamsService.detail(params.examId).then((r) => r.data),
  });

  const exam = examData as any;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pt-4">
        <Skeleton className="aspect-video w-full rounded-xl" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center">
        <div className="h-16 w-16 rounded-2xl bg-[var(--color-primary-50)] flex items-center justify-center mx-auto mb-4">
          <Info className="h-8 w-8 text-[var(--color-primary-600)]/40" />
        </div>
        <h2 className="text-xl font-bold text-[var(--foreground)]">Exam not found</h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">This exam could not be found.</p>
        <Button
          className="mt-5 bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] rounded-lg"
          onClick={() => router.back()}
        >
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pt-4 pb-20">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Hero */}
      <div className="relative aspect-video sm:aspect-[2.4/1] w-full rounded-xl overflow-hidden border border-[var(--border)]">
        <Image
          src={resolveImageUrl(exam.examImageUrl)}
          alt={exam.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 w-full text-white">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs font-semibold bg-white/20 text-white px-2.5 py-0.5 rounded-full backdrop-blur-sm">
              {exam.categoryName ?? "General"}
            </span>
            {exam.status === "active" && (
              <span className="text-xs font-semibold bg-green-500/80 text-white px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                Enrolling Now
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">{exam.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left — Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description */}
          <section>
            <h2 className="text-lg font-bold text-[var(--foreground)] mb-3 flex items-center gap-2">
              <Info className="h-5 w-5 text-[var(--color-primary-600)]" /> Description
            </h2>
            <div
              className="text-sm text-[var(--muted-foreground)] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: exam.description || "No description available for this exam." }}
            />
          </section>

          {/* Linked Courses */}
          <section>
            <h2 className="text-lg font-bold text-[var(--foreground)] mb-3 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[var(--color-primary-600)]" /> Linked Courses
            </h2>
            <div className="space-y-3">
              {(exam.courseDetails || []).length === 0 ? (
                <div className="border-2 border-dashed border-[var(--border)] rounded-xl p-8 text-center text-sm text-[var(--muted-foreground)]">
                  No courses linked to this exam package.
                </div>
              ) : (
                exam.courseDetails.map((course: any) => (
                  <div
                    key={course.id}
                    className="group bg-white border border-[var(--border)] rounded-xl p-4 hover:border-[var(--color-primary-600)] transition-colors cursor-pointer flex items-center gap-4"
                    onClick={() => router.push(ROUTES.COURSE_DETAIL(course.id))}
                  >
                    <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-[var(--color-primary-50)]">
                      <Image
                        src={resolveImageUrl(course.courseIconUrl || course.thumbnailUrl)}
                        alt={course.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-[var(--foreground)] line-clamp-1 group-hover:text-[var(--color-primary-600)] transition-colors">
                        {course.title}
                      </h4>
                      <p className="text-xs text-[var(--muted-foreground)] line-clamp-1 mt-0.5">
                        {course.description || "Master the concepts for this exam."}
                      </p>
                      <div className="flex items-center gap-1 text-xs font-semibold text-[var(--color-primary-600)] mt-1.5">
                        <PlayCircle className="h-3.5 w-3.5" />
                        {course.classCount || 0} Classes
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-[var(--muted-foreground)] shrink-0" />
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right — Sidebar */}
        <div>
          <div className="sticky top-[calc(var(--topbar-height)+1rem)] bg-white border border-[var(--border)] rounded-xl p-6 space-y-5">
            <h3 className="font-bold text-sm text-[var(--muted-foreground)] uppercase tracking-wide">Quick Info</h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-[var(--color-primary-50)] flex items-center justify-center shrink-0">
                  <Calendar className="h-4 w-4 text-[var(--color-primary-600)]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--muted-foreground)]">Validity</p>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{exam.validityDays || 365} Days Access</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-[var(--color-primary-50)] flex items-center justify-center shrink-0">
                  <ClipboardList className="h-4 w-4 text-[var(--color-primary-600)]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--muted-foreground)]">Included</p>
                  <p className="text-sm font-semibold text-[var(--foreground)]">Multiple Mock Test Sessions</p>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-5 space-y-3">
              <Button className="w-full h-11 text-sm font-semibold bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] rounded-lg">
                Get Access Now
              </Button>
              <p className="text-[10px] text-center text-[var(--muted-foreground)] leading-relaxed">
                Gain access to all linked courses and mock tests instantly after purchase.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
