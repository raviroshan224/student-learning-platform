"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Calendar, ArrowLeft, ClipboardList, Info, ChevronRight, PlayCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExamsService } from "@/services/api/exams.service";
import { ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";

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
        <Skeleton className="aspect-video w-full rounded-2xl" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center">
        <Info className="h-12 w-12 mx-auto text-[var(--muted-foreground)]" />
        <h2 className="mt-4 text-xl font-bold">Exam not found</h2>
        <Button className="mt-4" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pt-4 pb-20">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1.5 -ml-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      {/* Hero Section */}
      <div className="relative aspect-video sm:aspect-[2.4/1] w-full rounded-3xl overflow-hidden shadow-2xl border border-[var(--border)]">
        <Image
          src={resolveImageUrl(exam.examImageUrl)}
          alt={exam.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 sm:p-10 w-full text-white">
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <Badge variant="secondary" className="bg-white/10 text-white border-white/20 backdrop-blur-md">
                    {exam.categoryName ?? "General"}
                </Badge>
                {exam.status === 'active' && (
                    <Badge variant="secondary" className="bg-[var(--color-success)]/20 text-[var(--color-success-foreground)] border-[var(--color-success)]/30 backdrop-blur-md">
                        Enrolling Now
                    </Badge>
                )}
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight drop-shadow-lg">{exam.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Content) */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Info className="h-5 w-5 text-[var(--color-primary-600)]" /> Description
            </h2>
            <div 
              className="prose prose-sm prose-slate max-w-none text-[var(--muted-foreground)] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: exam.description || "No description available for this exam." }}
            />
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[var(--color-primary-600)]" /> Linked Courses
            </h2>
            <div className="space-y-4">
                {(exam.courseDetails || []).length === 0 ? (
                    <Card className="border-dashed border-2">
                        <CardContent className="py-10 text-center text-[var(--muted-foreground)]">
                            No courses linked to this exam package.
                        </CardContent>
                    </Card>
                ) : (
                    exam.courseDetails.map((course: any) => (
                        <Card 
                            key={course.id} 
                            className="group hover:bg-[var(--muted)]/30 transition-colors cursor-pointer overflow-hidden border-[var(--border)]"
                            onClick={() => router.push(ROUTES.COURSE_DETAIL(course.id))}
                        >
                            <CardContent className="p-4 sm:p-5 flex items-center gap-4">
                                <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-xl overflow-hidden bg-[var(--muted)] shadow-sm">
                                    <Image
                                        src={resolveImageUrl(course.courseIconUrl || course.thumbnailUrl)}
                                        alt={course.title}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-base sm:text-lg line-clamp-1 mb-1 group-hover:text-[var(--color-primary-600)] transition-colors">
                                        {course.title}
                                    </h4>
                                    <p className="text-sm text-[var(--muted-foreground)] line-clamp-1 mb-2">
                                        {course.description || "Master the concepts for this exam."}
                                    </p>
                                    <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-tight text-[var(--color-primary-600)]">
                                        <div className="flex items-center gap-1">
                                            <PlayCircle className="h-3.5 w-3.5" />
                                            {course.classCount || 0} Classes
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]" />
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
          </section>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-6">
            <Card className="sticky top-[var(--topbar-height)] overflow-hidden shadow-xl border-[var(--border)]">
                <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg uppercase tracking-wider text-[var(--muted-foreground)]">Quick Info</h3>
                        
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="h-9 w-9 rounded-lg bg-[var(--color-primary-50)] flex items-center justify-center shrink-0">
                                    <Calendar className="h-5 w-5 text-[var(--color-primary-600)]" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wide">Validity</p>
                                    <p className="text-sm font-semibold">{exam.validityDays || 365} Days Access</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="h-9 w-9 rounded-lg bg-[var(--color-primary-50)] flex items-center justify-center shrink-0">
                                    <ClipboardList className="h-5 w-5 text-[var(--color-primary-600)]" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wide">Included</p>
                                    <p className="text-sm font-semibold">Multiple Mock Test Sessions</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr className="border-[var(--border)]" />

                    <div className="space-y-3">
                        <Button className="w-full h-12 text-base font-bold shadow-lg" size="lg">
                            Get Access Now
                        </Button>
                        <p className="text-[10px] text-center text-[var(--muted-foreground)] px-4 leading-relaxed uppercase tracking-tight font-medium">
                            Gain access to all linked courses and mock tests instantly after purchase.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
