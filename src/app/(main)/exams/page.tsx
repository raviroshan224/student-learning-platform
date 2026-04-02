"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ClipboardList, Clock, CheckCircle, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ExamsService } from "@/services/api/exams.service";
import { EnrollmentsService } from "@/services/api/enrollments.service";
import type { MockTestModel } from "@/types/models/exam";
import toast from "react-hot-toast";

type Tab = "available" | "history";

function resolveImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return `https://olp-uploads.s3.us-east-1.amazonaws.com/${url.startsWith("/") ? url.slice(1) : url}`;
}

export default function ExamsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("available");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: enrollmentsRaw, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["my-enrollments"],
    queryFn: () => EnrollmentsService.myCourses().then((r) => r.data),
  });

  const enrollments = Array.isArray(enrollmentsRaw)
    ? enrollmentsRaw
    : (enrollmentsRaw as any)?.data ?? [];

  const firstCourseId = enrollments[0]?.course?.id ?? null;
  const activeCourseId = selectedCourseId ?? firstCourseId;

  const selectedCourse = enrollments.find(
    (e: any) => e.course?.id === activeCourseId
  )?.course;

  const { data: mockTestsRaw, isLoading: mockTestsLoading } = useQuery({
    queryKey: ["mock-tests", activeCourseId],
    queryFn: () =>
      ExamsService.mockTests(activeCourseId!).then((r) =>
        Array.isArray(r.data) ? r.data : (r.data as any)?.data ?? []
      ),
    enabled: !!activeCourseId,
  });

  const { data: historyRaw, isLoading: historyLoading } = useQuery({
    queryKey: ["test-history"],
    queryFn: () =>
      ExamsService.sessionHistory().then((r) =>
        Array.isArray(r.data) ? r.data : (r.data as any)?.data ?? []
      ),
    enabled: activeTab === "history",
  });

  const mockTests: MockTestModel[] = mockTestsRaw ?? [];
  const history: any[] = historyRaw ?? [];

  const startMutation = useMutation({
    mutationFn: ({ mockTestId, test }: { mockTestId: string; test: MockTestModel }) =>
      ExamsService.startSession(mockTestId).then((res) => ({ res, test })),
    onSuccess: ({ res, test }) => {
      const session = res.data as any;
      // Store session + questions in sessionStorage for the session page
      sessionStorage.setItem(
        `session_${session.id}`,
        JSON.stringify({
          ...session,
          title: test.title,
          timeLimitMinutes: test.timeLimitMinutes,
        })
      );
      router.push(`/test/session/${session.id}`);
    },
    onError: () => {
      toast.error("Failed to start test. Please try again.");
    },
  });

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-xl font-bold text-[var(--foreground)]">Mock Tests</h1>

      {/* Course Selector */}
      {enrollmentsLoading ? (
        <Skeleton className="h-8 w-48" />
      ) : enrollments.length > 0 ? (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[var(--muted-foreground)] font-medium">Course:</span>
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-1.5 font-semibold text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] transition-colors"
            >
              {selectedCourse?.courseTitle ?? "Select a course"}
              <ChevronDown className="h-4 w-4" />
            </button>
            {showDropdown && (
              <div className="absolute top-full left-0 z-20 mt-1 w-72 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] shadow-lg overflow-hidden">
                {enrollments.map((e: any) => (
                  <button
                    key={e.course?.id}
                    onClick={() => {
                      setSelectedCourseId(e.course?.id);
                      setShowDropdown(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--muted)] transition-colors",
                      activeCourseId === e.course?.id &&
                        "bg-[var(--color-primary-50)] text-[var(--color-primary-700)]"
                    )}
                  >
                    {e.course?.courseTitle}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Tabs */}
      <div className="border-b border-[var(--border)]">
        <div className="flex">
          {(["available", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
                activeTab === tab
                  ? "border-[var(--color-primary-600)] text-[var(--color-primary-700)]"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              {tab === "available" ? "Available Tests" : "Test History"}
            </button>
          ))}
        </div>
      </div>

      {/* Available Tests */}
      {activeTab === "available" && (
        <>
          {!activeCourseId ? (
            <div className="py-16 text-center text-[var(--muted-foreground)]">
              <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No enrolled courses</p>
              <p className="text-sm mt-1">Enroll in a course to access mock tests</p>
            </div>
          ) : mockTestsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-[var(--radius-md)]" />
              ))}
            </div>
          ) : mockTests.length === 0 ? (
            <div className="py-16 text-center text-[var(--muted-foreground)]">
              <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No tests available</p>
              <p className="text-sm mt-1">No mock tests for this course yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mockTests.map((test) => (
                <Card key={test.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-[var(--radius)] bg-[var(--color-primary-50)] flex items-center justify-center">
                        <ClipboardList className="h-5 w-5 text-[var(--color-primary-600)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm line-clamp-1">{test.title}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-[var(--muted-foreground)]">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {test.timeLimitMinutes} min
                          </span>
                          <span>{test.questionCount} questions</span>
                          <span>{test.totalMarks} marks</span>
                        </div>
                        {test.attempted && test.lastAttemptScore != null && (
                          <p className="text-xs text-[var(--color-primary-600)] mt-0.5 font-medium">
                            Last score: {test.lastAttemptScore}/{test.totalMarks}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1.5">
                        {test.attempted && (
                          <Badge variant="outline" className="text-[10px]">Attempted</Badge>
                        )}
                        <Button
                          size="sm"
                          onClick={() => startMutation.mutate({ mockTestId: test.id, test })}
                          disabled={startMutation.isPending}
                        >
                          {test.attempted ? "Retake" : "Start Test"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Test History */}
      {activeTab === "history" && (
        <>
          {historyLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-[var(--radius-md)]" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="py-16 text-center text-[var(--muted-foreground)]">
              <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No test history yet</p>
              <p className="text-sm mt-1">Complete a test to see your results here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item: any) => (
                <Card key={item.sessionId} className="hover:shadow-sm transition-shadow">
                  <CardContent className="py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${
                          item.passed
                            ? "bg-[var(--color-success)]/10"
                            : "bg-[var(--color-danger)]/10"
                        }`}
                      >
                        <CheckCircle
                          className={`h-5 w-5 ${
                            item.passed
                              ? "text-[var(--color-success)]"
                              : "text-[var(--color-danger)]"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm line-clamp-1">
                          {item.examTitle ?? item.mockTestTitle ?? "Mock Test"}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-[var(--muted-foreground)]">
                          <span
                            className={`font-bold ${
                              item.passed
                                ? "text-[var(--color-success)]"
                                : "text-[var(--color-danger)]"
                            }`}
                          >
                            {item.percentage}%
                          </span>
                          <span>
                            {item.score}/{item.totalMarks} marks
                          </span>
                          {item.submittedAt && (
                            <span>
                              {new Date(item.submittedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge
                        className={`text-[10px] shrink-0 ${
                          item.passed
                            ? "bg-[var(--color-success)] text-white border-0"
                            : "bg-[var(--color-danger)] text-white border-0"
                        }`}
                      >
                        {item.passed ? "Passed" : "Failed"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
