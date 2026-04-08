"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
    Clock, 
    HelpCircle, 
    CheckCircle2, 
    History, 
    ArrowLeft, 
    PlayCircle, 
    ShieldAlert, 
    ShoppingBag,
    ClipboardList,
    Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExamsService } from "@/services/api/exams.service";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

export default function TestDetailPage() {
  const params = useParams<{ testId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = searchParams.get("courseId");
  const testId = params.testId;

  const { data: tests, isLoading } = useQuery({
    queryKey: ["mock-tests", courseId],
    queryFn: () => ExamsService.mockTests(courseId!).then((r) => r.data),
    enabled: !!courseId,
  });

  const test = (tests || []).find((t: any) => t.id === testId);

  const startMutation = useMutation({
    mutationFn: () => ExamsService.startSession(testId),
    onSuccess: (res) => {
      // API wraps in { data: {...} } — unwrap before use
      const raw = res.data as any;
      const session = raw?.data ?? raw;
      const sessionId = session?.id ?? session?.sessionId;
      sessionStorage.setItem(
        `session_${sessionId}`,
        JSON.stringify({
          ...session,
          title: test?.title,
          timeLimitMinutes: test?.timeLimitMinutes ?? test?.durationMinutes,
          expiresAt: session?.expiresAt ?? session?.endsAt ?? session?.endTime,
        })
      );
      router.push(`/tests/session/${sessionId}/quiz`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to start test. Please check if you have active attempts left.");
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pt-6">
        <Skeleton className="h-10 w-3/4" />
        <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <ShieldAlert className="h-12 w-12 mx-auto text-[var(--muted-foreground)] opacity-30" />
        <h2 className="text-xl font-bold">Test Details Unavailable</h2>
        <p className="text-[var(--muted-foreground)]">The test details could not be loaded. Please ensure you've selected a course first.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const canTakeTest = test.canTakeTest || (!test.maxAttemptsReached && (test.isFree || test.isPurchased));

  return (
    <div className="max-w-3xl mx-auto space-y-8 pt-4 pb-20">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1.5 -ml-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          <ArrowLeft className="h-4 w-4" /> Back to List
        </Button>
      </div>

      {/* Header Info Card */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-extrabold tracking-tight">{test.title}</h1>
            {test.isFree && <Badge className="bg-[var(--color-success)] text-white border-0 w-fit">Free Test</Badge>}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: "Questions",
              value: `${test.questionCount ?? test.numberOfQuestions ?? "?"} Qs`,
              icon: <HelpCircle className="h-4 w-4" />,
            },
            {
              label: "Duration",
              value: `${test.timeLimitMinutes ?? test.durationMinutes ?? "?"} Mins`,
              icon: <Clock className="h-4 w-4" />,
            },
            {
              label: "Total Marks",
              value: test.totalMarks != null ? `${test.totalMarks} Marks` : "—",
              icon: <CheckCircle2 className="h-4 w-4" />,
            },
            {
              label: "Attempts",
              value: test.remainingAttempts != null ? `${test.remainingAttempts} Left` : "Unlimited",
              icon: <History className="h-4 w-4" />,
            },
          ].map((item) => (
            <Card key={item.label} className="border border-[var(--border)] rounded-xl bg-white shadow-none">
              <CardContent className="p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
                  {item.icon}
                  <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                </div>
                <p className="font-bold text-[var(--foreground)] text-sm">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-[var(--color-primary-600)]" /> General Instructions
        </h3>
        <Card className="border border-[var(--border)] rounded-xl shadow-none">
            <CardContent className="p-6 space-y-4">
                {test.description && (
                    <div
                        className="prose prose-sm max-w-none text-[var(--muted-foreground)] leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: test.description }}
                    />
                )}

                {/* API-provided instructions take priority; fall back to defaults */}
                <ul className="space-y-3 pt-4 border-t border-[var(--border)]">
                    {(
                        (test.instructions && test.instructions.length > 0)
                            ? test.instructions
                            : [
                                "Ensure a stable internet connection throughout the test.",
                                "Once started, the timer cannot be paused.",
                                "Avoid switching tabs or minimizing the browser (15s limit).",
                                "Each question carries marks as per the specified weightage.",
                                "Total attempts are limited based on your subscription.",
                              ]
                    ).map((inst: string, i: number) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm">
                            <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary-500)] mt-1.5 shrink-0" />
                            <span>{inst}</span>
                        </li>
                    ))}
                </ul>

                {/* Passing percentage & average score */}
                {(test.passingPercentage != null || test.averageScore != null) && (
                    <div className="flex flex-wrap gap-4 pt-4 border-t border-[var(--border)]">
                        {test.passingPercentage != null && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-[var(--muted-foreground)]">Passing score:</span>
                                <span className="font-bold text-[var(--color-warning)]">{test.passingPercentage}%</span>
                            </div>
                        )}
                        {test.averageScore != null && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-[var(--muted-foreground)]">Average score:</span>
                                <span className="font-bold text-[var(--foreground)]">{test.averageScore}%</span>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
      </section>

      {/* Subject Distribution */}
      {test.subjectDistribution && test.subjectDistribution.length > 0 && (
          <section className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
                <Layers className="h-5 w-5 text-[var(--color-primary-600)]" /> Subject Breakdown
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {test.subjectDistribution.map((sub: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-[var(--muted)]/20 border border-[var(--border)]/50">
                        <span className="font-semibold text-[var(--foreground)] transition-colors">{sub.subjectName}</span>
                        <Badge variant="outline" className="bg-white">{sub.questionCount} Qs</Badge>
                    </div>
                ))}
            </div>
          </section>
      )}

      {/* CTA Section */}
      <div className="flex flex-col gap-4 pt-4">
        {canTakeTest ? (
          <Button
            className="w-full h-12 text-base font-semibold bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] gap-2 rounded-lg"
            onClick={() => startMutation.mutate()}
            disabled={startMutation.isPending}
          >
            {startMutation.isPending ? (
                "Preparing Session..."
            ) : (
                <>
                    <PlayCircle className="h-5 w-5" />
                    {test.attempted ? "Retake Exam" : "Start Mock Test"}
                </>
            )}
          </Button>
        ) : (
          <div className="space-y-3">
             <Button className="w-full h-12 text-base font-semibold bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] gap-2 rounded-lg">
                <ShoppingBag className="h-5 w-5" /> Buy Test Package
             </Button>
             <p className="text-xs text-center text-[var(--color-danger)] font-medium">
                Maximum attempt limit reached for this session
             </p>
          </div>
        )}
        
        <p className="text-xs text-center text-[var(--muted-foreground)] px-4 leading-relaxed font-medium">
            By starting the test, you agree to our academic integrity guidelines and testing policy.
        </p>
      </div>
    </div>
  );
}
