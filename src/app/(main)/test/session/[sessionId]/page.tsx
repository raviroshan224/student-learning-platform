"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Flag, ChevronLeft, ChevronRight, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExamsService } from "@/services/api/exams.service";
import type { QuestionModel } from "@/types/models/exam";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

type Answers = Record<string, string>; // questionId → selectedOptionId

export default function TestSessionPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const { sessionId } = params;

  const [questions, setQuestions] = useState<QuestionModel[]>([]);
  const [sessionMeta, setSessionMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Answers>({});
  const [flagged, setFlagged] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load session from router state (passed when navigating) or re-fetch
  useEffect(() => {
    // The session was started via ExamsService.startSession → res.data has questions
    // We navigate with session data in router state. If not, try fetching.
    const stored = sessionStorage.getItem(`session_${sessionId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSessionMeta(parsed);
        setQuestions(parsed.questions ?? []);
        // Set timer: timeLimitMinutes from mockTest
        const mins = parsed.timeLimitMinutes ?? 60;
        setTimeRemaining(mins * 60);
        setLoading(false);
        return;
      } catch {
        /* fall through */
      }
    }
    setLoading(false);
  }, [sessionId]);

  // Countdown timer
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
  }, [loading]);

  const handleSubmit = useCallback(
    async (auto = false) => {
      if (submitting) return;
      setSubmitting(true);
      setShowConfirm(false);
      try {
        const payload = Object.entries(answers).map(([questionId, selectedOptionId]) => ({
          questionId,
          selectedOptionId,
        }));
        const res = await ExamsService.submitSession(sessionId, payload);
        sessionStorage.removeItem(`session_${sessionId}`);
        // Navigate to result display
        router.replace(`/test/session/${sessionId}/result`);
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? "Failed to submit. Please try again.");
        setSubmitting(false);
      }
    },
    [answers, sessionId, submitting, router]
  );

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-48 w-full rounded-[var(--radius-lg)]" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center text-[var(--muted-foreground)]">
        <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">Session not found</p>
        <p className="text-sm mt-1">Please go back and start the test again.</p>
        <Button className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const question = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;
  const isTimeLow = timeRemaining > 0 && timeRemaining < 300;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 sticky top-[var(--topbar-height)] bg-[var(--background)] py-2 z-10">
        <h1 className="font-semibold text-sm sm:text-base truncate">
          {sessionMeta?.title ?? "Mock Test"}
        </h1>
        <div className="flex items-center gap-3 shrink-0">
          {timeRemaining > 0 && (
            <div
              className={cn(
                "flex items-center gap-1.5 font-mono font-bold text-base",
                isTimeLow ? "text-[var(--color-danger)]" : "text-[var(--foreground)]"
              )}
            >
              <Clock className={cn("h-4 w-4", isTimeLow && "animate-pulse")} />
              {formatTime(timeRemaining)}
            </div>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowConfirm(true)}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3">
        <Progress value={progress} className="flex-1 h-1.5" />
        <span className="text-xs text-[var(--muted-foreground)] shrink-0 whitespace-nowrap">
          {answeredCount}/{questions.length} answered
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question Panel */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardContent className="pt-5 pb-5 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary">Q{currentIndex + 1}</Badge>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      of {questions.length}
                    </span>
                  </div>
                  <p className="text-sm sm:text-base font-medium leading-relaxed">
                    {question.questionText}
                  </p>
                </div>
                <button
                  onClick={() =>
                    setFlagged((prev) =>
                      prev.includes(question.id)
                        ? prev.filter((id) => id !== question.id)
                        : [...prev, question.id]
                    )
                  }
                  className={cn(
                    "shrink-0 p-1.5 rounded-[var(--radius-sm)] transition-colors",
                    flagged.includes(question.id)
                      ? "text-[var(--color-warning)] bg-yellow-50"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                  )}
                  title="Flag for review"
                >
                  <Flag className="h-4 w-4" />
                </button>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {question.options.map((opt, oi) => {
                  const selected = answers[question.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() =>
                        setAnswers((prev) => ({ ...prev, [question.id]: opt.id }))
                      }
                      className={cn(
                        "w-full text-left rounded-[var(--radius)] border p-3 text-sm transition-colors",
                        selected
                          ? "border-[var(--color-primary-600)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)]"
                          : "border-[var(--border)] hover:border-[var(--color-primary-300)] hover:bg-[var(--muted)]"
                      )}
                    >
                      <span className="font-semibold mr-2 text-[var(--muted-foreground)]">
                        {String.fromCharCode(65 + oi)}.
                      </span>
                      {opt.text}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Prev / Next */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button
              size="sm"
              onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
              disabled={currentIndex === questions.length - 1}
              className="gap-1"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Question Navigator */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Questions</h3>
          <div className="grid grid-cols-5 lg:grid-cols-4 gap-1.5">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "h-8 w-8 rounded-[var(--radius-sm)] text-xs font-medium border transition-colors",
                  idx === currentIndex
                    ? "bg-[var(--color-primary-600)] text-white border-[var(--color-primary-600)]"
                    : answers[q.id]
                    ? "bg-[var(--color-success)] text-white border-[var(--color-success)]"
                    : flagged.includes(q.id)
                    ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                    : "bg-[var(--card)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--muted)]"
                )}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          <div className="space-y-1 text-xs text-[var(--muted-foreground)]">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-[var(--color-success)]" /> Answered
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-yellow-100 border border-yellow-300" /> Flagged
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm border border-[var(--border)]" /> Unanswered
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="pt-6 pb-6 space-y-4 text-center">
              <AlertCircle className="h-10 w-10 mx-auto text-[var(--color-warning)]" />
              <div>
                <h2 className="font-bold text-lg">Submit Test?</h2>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  You have answered {answeredCount} of {questions.length} questions.
                  {answeredCount < questions.length && (
                    <span className="block mt-1 text-[var(--color-warning)] font-medium">
                      {questions.length - answeredCount} question(s) unanswered.
                    </span>
                  )}
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowConfirm(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => handleSubmit()}
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
