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

export default function TestsPage() {
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
    mutationFn: async ({ mockTestId, test, courseId }: { mockTestId: string; test: MockTestModel; courseId?: string }) => {
      try {
        const res = await ExamsService.startSession(mockTestId);
        return { res, test };
      } catch (err: any) {
        if (err?.response?.status === 403) {
          // Attempt automatic unlock in dev environment
          toast.loading("Unlocking test session...", { id: "unlocking" });
          try {
            // Some backends want courseId for unlocking tests inside a course
            await ExamsService.unlockTest(mockTestId, courseId);
            toast.success("Test unlocked!", { id: "unlocking" });
            const retryRes = await ExamsService.startSession(mockTestId);
            return { res: retryRes, test };
          } catch (unlockErr) {
            toast.error("Failed to unlock test. Please check your enrollment.", { id: "unlocking" });
            throw unlockErr;
          }
        }
        throw err;
      }
    },
    onSuccess: ({ res, test }) => {
      // API wraps in { data: {...} } — unwrap before use
      const raw = res.data as any;
      const session = raw?.data ?? raw;
      const sessionId = session?.id ?? session?.sessionId;
      sessionStorage.setItem(
        `session_${sessionId}`,
        JSON.stringify({
          ...session,
          title: test.title,
          timeLimitMinutes: test.timeLimitMinutes ?? test.durationMinutes,
          mockTestId: test.id,
        })
      );
      router.push(`/tests/session/${sessionId}/quiz`);
    },
    onError: (err: any) => {
      if (err?.response?.status !== 403) {
        toast.error(err?.response?.data?.message || "Failed to start test. Please try again.");
      }
    },
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">Mock Tests</h1>
      </div>

      {/* Course Selector - Inline Row per test.png */}
      {enrollmentsLoading ? (
        <Skeleton className="h-6 w-64" />
      ) : enrollments.length > 0 ? (
        <div className="flex items-center gap-3 text-sm sm:text-base">
          <span className="text-[var(--muted-foreground)] font-medium">Course:</span>
          <div className="relative flex items-center gap-2">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-1.5 font-bold text-[var(--foreground)] hover:text-[var(--color-primary-600)] transition-colors group"
            >
              {selectedCourse?.courseTitle ?? "Select a course"}
              <ChevronDown className={cn("h-4 w-4 transition-transform", showDropdown && "rotate-180")} />
            </button>
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-1 rounded-full hover:bg-[var(--muted)] text-[var(--color-primary-600)]"
              title="Change Course"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            </button>
            
            {showDropdown && (
              <div className="absolute top-full left-0 z-50 mt-2 w-72 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-xl overflow-hidden ring-1 ring-black/5 animate-in fade-in slide-in-from-top-1">
                <div className="py-1">
                  {enrollments.map((e: any) => (
                    <button
                      key={e.course?.id}
                      onClick={() => {
                        setSelectedCourseId(e.course?.id);
                        setShowDropdown(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-3 text-sm transition-colors",
                        activeCourseId === e.course?.id
                          ? "bg-[var(--color-primary-50)] text-[var(--color-primary-700)] font-bold"
                          : "hover:bg-[var(--muted)] text-[var(--muted-foreground)]"
                      )}
                    >
                      {e.course?.courseTitle}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Tabs - Underline style per docs */}
      <div className="border-b border-[var(--border)]">
        <div className="flex gap-8">
          {(["available", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-2 py-3 text-sm font-bold border-b-2 transition-all -mb-px",
                activeTab === tab
                  ? "border-[var(--color-primary-600)] text-[var(--color-primary-700)] translate-y-[1px]"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              {tab === "available" ? "Available Tests" : "Test History"}
            </button>
          ))}
        </div>
      </div>

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
                          onClick={() => startMutation.mutate({ mockTestId: test.id, test, courseId: activeCourseId || "" })}
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
              {history.map((item: any, idx: number) => {
                const sessionId = item.sessionId;
                const dateStr = item.completedAt ?? item.submittedAt;
                const dateLabel = dateStr
                  ? new Date(dateStr).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : null;

                return (
                  <Card
                    key={sessionId || idx}
                    className="hover:shadow-sm transition-shadow cursor-pointer group"
                    onClick={() => sessionId && router.push(`/tests/session/${sessionId}/result`)}
                  >
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
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm line-clamp-1 group-hover:text-[var(--color-primary-600)] transition-colors">
                              {item.examTitle ?? item.mockTestTitle ?? "Mock Test"}
                            </p>
                            {item.attemptNumber != null && (
                              <span className="text-[10px] font-bold text-[var(--muted-foreground)] shrink-0">
                                Attempt #{item.attemptNumber}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-[var(--muted-foreground)]">
                            <span
                              className={`font-bold ${
                                item.passed
                                  ? "text-[var(--color-success)]"
                                  : "text-[var(--color-danger)]"
                              }`}
                            >
                              {item.percentage != null ? `${item.percentage}%` : "—"}
                            </span>
                            {(item.score != null || item.correct != null) && (
                              <span>
                                {item.score != null
                                  ? `${item.score}/${item.totalMarks ?? item.totalQuestions} marks`
                                  : `${item.correct ?? 0} correct`}
                              </span>
                            )}
                            {item.attempted != null && item.totalQuestions != null && (
                              <span>{item.attempted}/{item.totalQuestions} attempted</span>
                            )}
                            {dateLabel && <span>{dateLabel}</span>}
                          </div>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-1.5">
                          <Badge
                            className={`text-[10px] ${
                              item.passed
                                ? "bg-[var(--color-success)] text-white border-0"
                                : "bg-[var(--color-danger)] text-white border-0"
                            }`}
                          >
                            {item.passed ? "Passed" : "Failed"}
                          </Badge>
                          <span className="text-[10px] text-[var(--color-primary-600)] font-bold group-hover:underline">
                            View Result →
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
