"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Flag, ChevronLeft, ChevronRight, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExamsService } from "@/services/api/exams.service";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

// ─── API response helper ──────────────────────────────────────────────────────
// Backend wraps all responses in { data: {...} } or { result: {...} }
function unwrap<T>(raw: any): T {
  if (raw && typeof raw === "object") {
    if ("data" in raw && raw.data !== undefined) return raw.data as T;
    if ("result" in raw && raw.result !== undefined) return raw.result as T;
  }
  return raw as T;
}

// ─── Field name helpers (mobile uses different names than old web types) ──────
function getQuestionText(q: any): string {
  return q?.prompt ?? q?.questionText ?? q?.question ?? q?.text ?? "";
}
function getOptionKey(opt: any, fallbackIndex: number): string {
  return opt?.key ?? opt?.id ?? String.fromCharCode(65 + fallbackIndex);
}
function getOptionLabel(opt: any): string {
  return opt?.label ?? opt?.text ?? "";
}
function getSessionId(session: any): string {
  return session?.id ?? session?.sessionId ?? "";
}
function getEndsAt(session: any): string | null {
  return session?.endsAt ?? session?.expiresAt ?? session?.ends_at ?? null;
}
function getPreselectedAnswer(questionData: any): string | null {
  // Mobile field: selectedOption / selectedAnswer / selectedOptionKey
  return (
    questionData?.selectedOption ??
    questionData?.selectedAnswer ??
    questionData?.selectedOptionKey ??
    null
  );
}

// ─── Timer formatting ─────────────────────────────────────────────────────────
function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────
// Track answers by questionIndex (matches mobile app), value = option key ("A","B",…)
type Answers = Record<number, string>;

export default function QuizPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const { sessionId } = params;

  const [sessionTitle, setSessionTitle] = useState("");
  const [questionsCount, setQuestionsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [questionLoading, setQuestionLoading] = useState(false);

  // Cache: questionIndex → raw question object from API
  const questionsCache = useRef<Record<number, any>>({});
  // Trigger re-renders when cache updates
  const [cacheVersion, setCacheVersion] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  // answers[questionIndex] = selectedOptionKey
  const [answers, setAnswers] = useState<Answers>({});
  // flagged = set of question indexes marked for review
  const [flagged, setFlagged] = useState<Set<number>>(new Set());

  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const pausedAtRef = useRef<number | null>(null);
  const BACKGROUND_THRESHOLD = 15 * 1000;

  // ── fetchQuestion ────────────────────────────────────────────────────────────
  const fetchQuestion = useCallback(
    async (index: number) => {
      // If cached, just switch to it (answer state is already in `answers`)
      if (questionsCache.current[index]) {
        setCurrentIndex(index);
        return;
      }

      setQuestionLoading(true);
      try {
        const res = await ExamsService.getQuestion(sessionId, index);
        // Unwrap { data: {...} } wrapper
        const payload = unwrap<any>(res.data);
        // Question may be at payload.question (old web format) or payload itself (mobile format)
        const questionData = payload?.question ?? payload;

        questionsCache.current[index] = questionData;
        setCacheVersion((v) => v + 1);

        // Restore pre-existing answer (if user already answered this question)
        const preSelected = getPreselectedAnswer(questionData) ?? getPreselectedAnswer(payload);
        if (preSelected) {
          setAnswers((prev) => ({ ...prev, [index]: preSelected }));
        }

        // Restore review flag
        const isReview =
          questionData?.isMarkedForReview ??
          questionData?.flagged ??
          payload?.isMarkedForReview ??
          false;
        if (isReview) {
          setFlagged((prev) => new Set(prev).add(index));
        }

        setCurrentIndex(index);
      } catch (err) {
        console.error("Failed to fetch question", err);
        toast.error("Failed to load question.");
      } finally {
        setQuestionLoading(false);
      }
    },
    [sessionId]
  );

  // ── Load session on mount ────────────────────────────────────────────────────
  useEffect(() => {
    const loadSession = async () => {
      try {
        const res = await ExamsService.getSession(sessionId);
        const session = unwrap<any>(res.data);

        setSessionTitle(
          session?.title ?? session?.examTitle ?? session?.mockTestTitle ?? "Mock Test"
        );
        const total =
          session?.totalQuestions ?? session?.questionCount ?? session?.total ?? 0;
        setQuestionsCount(total);

        // Timer: prefer endsAt (mobile), fall back to expiresAt (old web)
        const endsAtStr = getEndsAt(session);
        if (endsAtStr) {
          const ends = new Date(endsAtStr).getTime();
          setTimeRemaining(Math.max(0, Math.floor((ends - Date.now()) / 1000)));
        } else {
          // Derive from durationMinutes if server didn't provide absolute time
          const mins = session?.durationMinutes ?? session?.timeLimitMinutes ?? 60;
          setTimeRemaining(mins * 60);
        }

        // Pre-populate question cache from embedded questions array (mobile API
        // returns all questions inside the session object — no per-question endpoint)
        const embeddedQuestions: any[] = Array.isArray(session?.questions)
          ? session.questions
          : [];
        embeddedQuestions.forEach((q: any) => {
          const idx = q.index ?? q.questionIndex;
          if (idx != null) {
            questionsCache.current[idx] = q;
            // Restore any pre-existing answer
            const pre = getPreselectedAnswer(q);
            if (pre) {
              setAnswers((prev) => ({ ...prev, [idx]: pre }));
            }
            if (q.isMarkedForReview ?? q.flagged) {
              setFlagged((prev) => new Set(prev).add(idx));
            }
          }
        });

        const startIdx = session?.currentQuestionIndex ?? 0;
        // If cache has the first question (from embedded data), just show it;
        // otherwise fall back to per-question fetch (legacy endpoint)
        if (questionsCache.current[startIdx]) {
          setCacheVersion((v) => v + 1);
          setCurrentIndex(startIdx);
        } else {
          await fetchQuestion(startIdx);
        }
      } catch (err) {
        console.error("Failed to load session", err);
        toast.error("Failed to load test session.");
      } finally {
        setLoading(false);
      }
    };

    loadSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // ── Session summary (sidebar status dots) ────────────────────────────────────
  const { data: summaryRaw } = useQuery({
    queryKey: ["session-summary", sessionId],
    queryFn: () => ExamsService.summary(sessionId).then((r) => unwrap<any>(r.data)),
    enabled: !!sessionId && !loading,
    refetchInterval: 15000,
  });

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (_auto = false) => {
      if (submitting) return;
      setSubmitting(true);
      setShowConfirm(false);
      try {
        await ExamsService.submitSession(sessionId);
        sessionStorage.removeItem(`session_${sessionId}`);
        router.replace(`/tests/session/${sessionId}/result`);
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? "Failed to submit. Please try again.");
        setSubmitting(false);
      }
    },
    [sessionId, submitting, router]
  );

  // ── Background auto-submit ────────────────────────────────────────────────────
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        pausedAtRef.current = Date.now();
      } else {
        if (pausedAtRef.current) {
          const elapsed = Date.now() - pausedAtRef.current;
          if (elapsed >= BACKGROUND_THRESHOLD) {
            toast.error("Test auto-submitted: tab was inactive too long.");
            handleSubmit(true);
          }
          pausedAtRef.current = null;
        }
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [handleSubmit]);

  // ── Countdown ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading || timeRemaining <= 0) return;
    const t = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [loading, timeRemaining, handleSubmit]);

  // ── Option select ────────────────────────────────────────────────────────────
  const handleOptionSelect = async (optionKey: string) => {
    if (submitting || questionLoading) return;
    // Optimistic: store by questionIndex (matches mobile)
    setAnswers((prev) => ({ ...prev, [currentIndex]: optionKey }));
    try {
      await ExamsService.answer(sessionId, {
        questionIndex: currentIndex,
        selectedAnswer: optionKey,
      });
    } catch (err) {
      console.error("Failed to save answer", err);
      toast.error("Answer not saved — connection issue?");
    }
  };

  // ── Navigate ─────────────────────────────────────────────────────────────────
  const handleNavigate = async (newIndex: number) => {
    if (submitting || newIndex === currentIndex || newIndex < 0) return;
    // Fire-and-forget navigate call (not critical)
    ExamsService.navigate(sessionId, { questionIndex: newIndex }).catch(() => {});
    await fetchQuestion(newIndex);
  };

  // ── Flag / Mark for review ────────────────────────────────────────────────────
  const handleToggleFlag = async () => {
    const currently = flagged.has(currentIndex);
    setFlagged((prev) => {
      const next = new Set(prev);
      currently ? next.delete(currentIndex) : next.add(currentIndex);
      return next;
    });
    try {
      await ExamsService.markReview(sessionId, {
        questionIndex: currentIndex,
        markForReview: !currently,
      });
    } catch {
      // Rollback on failure
      setFlagged((prev) => {
        const next = new Set(prev);
        currently ? next.add(currentIndex) : next.delete(currentIndex);
        return next;
      });
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pt-10">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-64 w-full rounded-[var(--radius-lg)]" />
      </div>
    );
  }

  // ── Derived UI state ──────────────────────────────────────────────────────────
  const currentQuestion = questionsCache.current[currentIndex];
  const totalCount = questionsCount || summaryRaw?.total || summaryRaw?.totalQuestions || 0;
  const answeredCount = summaryRaw?.answered ?? Object.keys(answers).length;
  const progress = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;
  const isTimeLow = timeRemaining > 0 && timeRemaining < 300;
  const isFlaggedCurrent =
    flagged.has(currentIndex) ||
    summaryRaw?.questions?.find((q: any) => q.index === currentIndex)?.status === "marked_for_review";

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-10">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 sticky top-[var(--topbar-height)] bg-white border-b border-[var(--border)] py-3 px-1 z-10 -mx-1">
        <h1 className="font-semibold text-sm sm:text-base truncate text-[var(--foreground)]">
          {sessionTitle || "Mock Test Session"}
        </h1>
        <div className="flex items-center gap-3 shrink-0">
          {timeRemaining > 0 && (
            <div
              className={cn(
                "flex items-center gap-1.5 font-mono font-bold text-base rounded-lg px-3 py-1.5 border",
                isTimeLow
                  ? "text-[var(--color-danger)] bg-red-50 border-red-200"
                  : "text-[var(--foreground)] bg-[var(--muted)] border-[var(--border)]"
              )}
            >
              <Clock className={cn("h-4 w-4", isTimeLow && "animate-pulse")} />
              {formatTime(timeRemaining)}
            </div>
          )}
          <Button
            className="bg-[var(--color-danger)] hover:bg-red-700 text-white rounded-lg"
            size="sm"
            onClick={() => setShowConfirm(true)}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="flex items-center gap-3">
        <Progress value={progress} className="flex-1 h-1.5" />
        <span className="text-xs text-[var(--muted-foreground)] shrink-0 whitespace-nowrap">
          {answeredCount}/{totalCount} answered
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ── Question card ── */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="min-h-[300px] border-[var(--border)] rounded-xl">
            <CardContent className="pt-6 pb-6 space-y-5">
              {questionLoading || !currentQuestion ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                  <div className="space-y-2 pt-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              ) : (
                <>
                  {/* Question number + flag */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary">Q{currentIndex + 1}</Badge>
                        <span className="text-xs text-[var(--muted-foreground)]">
                          of {totalCount}
                        </span>
                      </div>
                      {/* Question text — try prompt then questionText */}
                      <p className="text-base sm:text-lg font-semibold leading-relaxed text-[var(--foreground)]">
                        {getQuestionText(currentQuestion)}
                      </p>
                    </div>
                    <button
                      onClick={handleToggleFlag}
                      className={cn(
                        "shrink-0 p-2 rounded-[var(--radius-sm)] transition-all",
                        isFlaggedCurrent
                          ? "text-[var(--color-warning)] bg-yellow-50 shadow-sm"
                          : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                      )}
                      title="Flag for review"
                    >
                      <Flag
                        className={cn("h-5 w-5", isFlaggedCurrent && "fill-current")}
                      />
                    </button>
                  </div>

                  {/* Question image */}
                  {currentQuestion?.imageUrl && (
                    <div className="rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--muted)]/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentQuestion.imageUrl}
                        alt="Question illustration"
                        className="w-full max-h-64 object-contain"
                      />
                    </div>
                  )}

                  {/* Question description / sub-text */}
                  {currentQuestion?.description && (
                    <p className="text-sm text-[var(--muted-foreground)] leading-relaxed border-l-4 border-[var(--color-primary-300)] pl-3 italic">
                      {currentQuestion.description}
                    </p>
                  )}

                  {/* Options */}
                  <div className="space-y-2.5">
                    {(() => {
                      const rawOptions = currentQuestion?.options;
                      const options: any[] = Array.isArray(rawOptions)
                        ? rawOptions
                        : rawOptions && typeof rawOptions === "object"
                        ? Object.entries(rawOptions).map(([key, label]) => ({ key, label }))
                        : [];

                      if (options.length === 0) {
                        return (
                          <div className="py-10 text-center text-sm text-[var(--muted-foreground)] bg-[var(--muted)]/20 rounded-xl border border-dashed border-[var(--border)]">
                            No options available for this question.
                          </div>
                        );
                      }

                      return options.map((opt: any, oi: number) => {
                        // Mobile uses `key` (A/B/C/D); fallback to `id` then letter
                        const optionKey = getOptionKey(opt, oi);
                        const optionText = getOptionLabel(opt);
                        // Answer tracking is by questionIndex, value is option key
                        const isSelected = answers[currentIndex] === optionKey;

                        return (
                          <button
                            key={optionKey}
                            onClick={() => handleOptionSelect(optionKey)}
                            disabled={submitting}
                            className={cn(
                              "w-full text-left rounded-xl border p-4 text-sm sm:text-base transition-all duration-200",
                              isSelected
                                ? "border-[var(--color-primary-600)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)] shadow-sm font-medium ring-1 ring-[var(--color-primary-600)]/20"
                                : "border-[var(--border)] hover:border-[var(--color-primary-300)] hover:bg-[var(--muted)]/50"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={cn(
                                  "flex items-center justify-center h-7 w-7 rounded-full border text-xs font-bold shrink-0 transition-colors",
                                  isSelected
                                    ? "bg-[var(--color-primary-600)] text-white border-[var(--color-primary-600)]"
                                    : "bg-[var(--muted)]/50 text-[var(--muted-foreground)] border-[var(--border)]"
                                )}
                              >
                                {String.fromCharCode(65 + oi)}
                              </span>
                              <span className="flex-1">{optionText}</span>
                            </div>
                          </button>
                        );
                      });
                    })()}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Prev / Next */}
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleNavigate(currentIndex - 1)}
              disabled={currentIndex === 0 || questionLoading || submitting}
              className="flex-1 sm:flex-none gap-2 font-semibold rounded-lg border-[var(--border)]"
            >
              <ChevronLeft className="h-5 w-5" /> Previous
            </Button>
            <Button
              size="lg"
              onClick={() => handleNavigate(currentIndex + 1)}
              disabled={currentIndex >= totalCount - 1 || questionLoading || submitting}
              className="flex-1 sm:flex-none gap-2 font-semibold rounded-lg bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)]"
            >
              Next <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[var(--border)] p-4">
            <h3 className="text-sm font-bold text-[var(--muted-foreground)] mb-4 uppercase tracking-wide">
              Questions
            </h3>
            <div className="grid grid-cols-5 md:grid-cols-6 lg:grid-cols-4 gap-2">
              {Array.from({ length: totalCount }).map((_, idx) => {
                const isCurrent = idx === currentIndex;
                // Server summary takes priority; fall back to local answers map
                const summaryQ = summaryRaw?.questions?.find((q: any) => q.index === idx);
                const isAnswered =
                  summaryQ?.status === "answered" || answers[idx] !== undefined;
                const isFlaggedQ =
                  summaryQ?.status === "marked_for_review" || flagged.has(idx);

                return (
                  <button
                    key={idx}
                    onClick={() => handleNavigate(idx)}
                    disabled={questionLoading || submitting}
                    className={cn(
                      "h-9 w-9 rounded-lg text-xs font-black border transition-all duration-200 flex items-center justify-center",
                      isCurrent
                        ? "bg-[var(--color-primary-600)] text-white border-[var(--color-primary-600)] shadow-md ring-2 ring-offset-2 ring-[var(--color-primary-600)]/30"
                        : isAnswered
                        ? "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/30"
                        : isFlaggedQ
                        ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                        : "bg-[var(--muted)]/10 text-[var(--muted-foreground)] border-[var(--border)] hover:bg-[var(--muted)]/30"
                    )}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 space-y-2 pt-4 border-t">
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                <div className="h-3 w-3 rounded-sm bg-[var(--color-success)]/20 border border-[var(--color-success)]/40" />{" "}
                Answered
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                <div className="h-3 w-3 rounded-sm bg-yellow-50 border border-yellow-200" />{" "}
                Flagged
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                <div className="h-3 w-3 rounded-sm bg-[var(--muted)]/10 border border-[var(--border)]" />{" "}
                Unanswered
              </div>
            </div>
          </div>

          <Card className="bg-[var(--color-primary-600)] text-white border-none shadow-lg">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-tighter opacity-80">
                  Progress
                </p>
                <p className="text-sm font-bold">{Math.round(progress)}% Completed</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Submit confirmation dialog ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-sm shadow-2xl border-2">
            <CardContent className="pt-8 pb-8 space-y-6 text-center">
              <div className="mx-auto h-16 w-16 bg-yellow-50 rounded-full flex items-center justify-center">
                <Flag className="h-8 w-8 text-yellow-600" />
              </div>
              <div>
                <h2 className="font-black text-2xl tracking-tight">Submit Test?</h2>
                <p className="text-sm text-[var(--muted-foreground)] mt-2 px-4">
                  You have answered{" "}
                  <span className="font-bold text-[var(--foreground)]">{answeredCount}</span> of{" "}
                  {totalCount} questions.
                  {answeredCount < totalCount && (
                    <span className="block mt-2 text-[var(--color-danger)] font-bold text-xs uppercase tracking-widest">
                      {totalCount - answeredCount} questions unanswered
                    </span>
                  )}
                </p>
              </div>
              <div className="flex gap-3 px-2">
                <Button
                  variant="outline"
                  className="flex-1 h-12 font-bold"
                  onClick={() => setShowConfirm(false)}
                  disabled={submitting}
                >
                  Go Back
                </Button>
                <Button
                  className="flex-1 h-12 font-bold"
                  onClick={() => handleSubmit()}
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Yes, Submit"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
