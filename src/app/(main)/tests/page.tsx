"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ClipboardList, Clock, CheckCircle, ChevronDown } from "lucide-react";
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
          toast.loading("Unlocking test session...", { id: "unlocking" });
          try {
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Mock Tests</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">Practice with timed tests to prepare for your NEB exams</p>
      </div>

      {/* Course Selector */}
      {enrollmentsLoading ? (
        <Skeleton className="h-6 w-64 rounded-lg" />
      ) : enrollments.length > 0 ? (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-[var(--muted-foreground)] font-medium">Course:</span>
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-1.5 font-semibold text-[var(--foreground)] hover:text-[var(--color-primary-600)] transition-colors bg-white border border-[var(--border)] rounded-lg px-3 py-1.5"
            >
              {selectedCourse?.courseTitle ?? "Select a course"}
              <ChevronDown className={cn("h-4 w-4 transition-transform text-[var(--muted-foreground)]", showDropdown && "rotate-180")} />
            </button>

            {showDropdown && (
              <div className="absolute top-full left-0 z-50 mt-1.5 w-72 rounded-xl border border-[var(--border)] bg-white shadow-[var(--shadow-lg)] overflow-hidden">
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
                          ? "bg-[var(--color-primary-50)] text-[var(--color-primary-600)] font-semibold"
                          : "hover:bg-[var(--muted)] text-[var(--foreground)]"
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

      {/* Tabs */}
      <div className="border-b border-[var(--border)]">
        <div className="flex gap-6">
          {(["available", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "py-3 text-sm font-semibold border-b-2 transition-all -mb-px",
                activeTab === tab
                  ? "border-[var(--color-primary-600)] text-[var(--color-primary-600)]"
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
            <div className="py-16 text-center">
              <div className="h-16 w-16 rounded-2xl bg-[var(--color-primary-50)] flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="h-8 w-8 text-[var(--color-primary-600)]/40" />
              </div>
              <p className="font-semibold text-[var(--foreground)]">No enrolled courses</p>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Enroll in a course to access mock tests</p>
            </div>
          ) : mockTestsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : mockTests.length === 0 ? (
            <div className="py-16 text-center">
              <div className="h-16 w-16 rounded-2xl bg-[var(--color-primary-50)] flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="h-8 w-8 text-[var(--color-primary-600)]/40" />
              </div>
              <p className="font-semibold text-[var(--foreground)]">No tests available</p>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">No mock tests for this course yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mockTests.map((test) => (
                <div
                  key={test.id}
                  className="bg-white border border-[var(--border)] rounded-xl p-4 hover:border-[var(--color-primary-600)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 shrink-0 rounded-xl bg-[var(--color-primary-50)] flex items-center justify-center">
                      <ClipboardList className="h-5 w-5 text-[var(--color-primary-600)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-[var(--foreground)] line-clamp-1">{test.title}</p>
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
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      {test.attempted && (
                        <span className="text-[10px] font-semibold bg-[var(--muted)] text-[var(--muted-foreground)] px-2 py-0.5 rounded-full">
                          Attempted
                        </span>
                      )}
                      <Button
                        size="sm"
                        className="bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] rounded-lg"
                        onClick={() => startMutation.mutate({ mockTestId: test.id, test, courseId: activeCourseId || "" })}
                        disabled={startMutation.isPending}
                      >
                        {test.attempted ? "Retake" : "Start Test"}
                      </Button>
                    </div>
                  </div>
                </div>
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
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="py-16 text-center">
              <div className="h-16 w-16 rounded-2xl bg-[var(--color-primary-50)] flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="h-8 w-8 text-[var(--color-primary-600)]/40" />
              </div>
              <p className="font-semibold text-[var(--foreground)]">No test history yet</p>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Complete a test to see your results here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item: any, idx: number) => {
                const sessionId = item.sessionId;
                const dateStr = item.completedAt ?? item.submittedAt;
                const dateLabel = dateStr
                  ? new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : null;

                return (
                  <div
                    key={sessionId || idx}
                    className="bg-white border border-[var(--border)] rounded-xl p-4 hover:border-[var(--color-primary-600)] transition-colors cursor-pointer group"
                    onClick={() => sessionId && router.push(`/tests/session/${sessionId}/result`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-11 w-11 shrink-0 rounded-xl flex items-center justify-center ${
                        item.passed ? "bg-green-50" : "bg-red-50"
                      }`}>
                        <CheckCircle className={`h-5 w-5 ${item.passed ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-[var(--foreground)] line-clamp-1 group-hover:text-[var(--color-primary-600)] transition-colors">
                            {item.examTitle ?? item.mockTestTitle ?? "Mock Test"}
                          </p>
                          {item.attemptNumber != null && (
                            <span className="text-[10px] font-medium text-[var(--muted-foreground)] shrink-0">
                              Attempt #{item.attemptNumber}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-[var(--muted-foreground)]">
                          <span className={`font-bold ${item.passed ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>
                            {item.percentage != null ? `${item.percentage}%` : "—"}
                          </span>
                          {(item.score != null || item.correct != null) && (
                            <span>
                              {item.score != null
                                ? `${item.score}/${item.totalMarks ?? item.totalQuestions} marks`
                                : `${item.correct ?? 0} correct`}
                            </span>
                          )}
                          {dateLabel && <span>{dateLabel}</span>}
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-2">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          item.passed
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {item.passed ? "Passed" : "Failed"}
                        </span>
                        <span className="text-[10px] text-[var(--color-primary-600)] font-semibold group-hover:underline">
                          View Result →
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
