"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, XCircle, Award, BookOpen, LayoutDashboard, Share2, Clock, Trophy, TrendingUp, MessageSquare } from "lucide-react";

function unwrap<T>(raw: any): T {
  if (raw && typeof raw === "object") {
    if ("data" in raw && raw.data !== undefined) return raw.data as T;
    if ("result" in raw && raw.result !== undefined) return raw.result as T;
  }
  return raw as T;
}
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExamsService } from "@/services/api/exams.service";
import { ROUTES } from "@/lib/constants/routes";

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function TestResultPage() {
  const params = useParams<{ sessionId: string }>();

  const { data: resultRaw, isLoading } = useQuery({
    queryKey: ["session-result", params.sessionId],
    queryFn: () => ExamsService.sessionResult(params.sessionId).then((r) => unwrap<any>(r.data)),
  });

  const result = resultRaw as any;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 pt-8">
        <Skeleton className="h-48 w-full rounded-[var(--radius-lg)]" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-32 rounded-[var(--radius-lg)]" />
          <Skeleton className="h-32 rounded-[var(--radius-lg)]" />
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center text-[var(--muted-foreground)]">
        <p className="font-medium">Result not available</p>
        <Link href={ROUTES.TESTS} className="mt-4 inline-block">
          <Button size="sm">Back to Tests</Button>
        </Link>
      </div>
    );
  }

  const passed = result.passed ?? result.percentage >= 50;
  const percentage = result.percentage ?? 0;
  const timeTaken = result.timeTaken ?? result.timeSpentSeconds ?? result.summary?.timeSpentSeconds;
  const correctCount = result.correctCount ?? result.correct ?? result.summary?.correct;
  const incorrectCount = result.incorrectCount ?? result.incorrect ?? result.summary?.incorrect;
  const skippedCount = result.skippedCount ?? result.skipped ?? result.summary?.skipped;
  const rank = result.rank;
  const percentile = result.percentile;
  const feedback = result.feedback;

  const primaryStats = [
    {
      label: "Total Marks",
      value: `${result.score ?? result.summary?.score ?? "-"}/${result.totalMarks ?? "-"}`,
      icon: <Award className="h-4 w-4" />,
    },
    {
      label: "Accuracy",
      value: `${percentage}%`,
      icon: <CheckCircle className="h-4 w-4" />,
    },
    {
      label: "Correct",
      value: correctCount ?? "-",
      color: "text-[var(--color-success)]",
      icon: <CheckCircle className="h-4 w-4" />,
    },
    {
      label: "Incorrect",
      value: incorrectCount ?? "-",
      color: "text-[var(--color-danger)]",
      icon: <XCircle className="h-4 w-4" />,
    },
  ];

  const secondaryStats = [
    ...(skippedCount != null
      ? [{ label: "Skipped", value: skippedCount, icon: <XCircle className="h-4 w-4" />, color: "text-[var(--muted-foreground)]" }]
      : []),
    ...(timeTaken != null
      ? [{ label: "Time Taken", value: formatTime(timeTaken), icon: <Clock className="h-4 w-4" /> }]
      : []),
    ...(rank != null
      ? [{ label: "Rank", value: `#${rank}`, icon: <Trophy className="h-4 w-4" />, color: "text-[var(--color-warning)]" }]
      : []),
    ...(percentile != null
      ? [{ label: "Percentile", value: `${percentile.toFixed(1)}%`, icon: <TrendingUp className="h-4 w-4" />, color: "text-[var(--color-primary-600)]" }]
      : []),
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pt-4 pb-12">
      {/* Result Hero */}
      <Card
        className={`overflow-hidden border ${
          passed ? "border-[var(--color-success)]/40" : "border-[var(--color-danger)]/40"
        } rounded-xl`}
      >
        <div className={`h-1.5 ${passed ? "bg-[var(--color-success)]" : "bg-[var(--color-danger)]"}`} />
        <CardContent className="py-10 text-center space-y-5">
          <div
            className={`mx-auto h-20 w-20 rounded-xl flex items-center justify-center ${
              passed ? "bg-[var(--color-success)]/10" : "bg-[var(--color-danger)]/10"
            }`}
          >
            {passed ? (
              <Award className="h-10 w-10 text-[var(--color-success)]" />
            ) : (
              <XCircle className="h-10 w-10 text-[var(--color-danger)]" />
            )}
          </div>

          <div className="space-y-1">
            <h1
              className={`text-2xl font-bold ${
                passed ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"
              }`}
            >
              {passed ? "Congratulations!" : "Don't Give Up!"}
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              {passed
                ? "You've successfully cleared the mock test."
                : "You were close! Review your mistakes and try again."}
            </p>
          </div>

          <div className="flex justify-center items-baseline gap-1">
            <span className="text-6xl font-black text-[var(--foreground)] tracking-tighter">
              {percentage}
            </span>
            <span className="text-2xl font-bold text-[var(--muted-foreground)]">%</span>
          </div>

          <div className="flex justify-center gap-2">
            <span
              className={`inline-block px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              {passed ? "PASS" : "FAIL"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {primaryStats.map((stat) => (
          <Card key={stat.label} className="border border-[var(--border)] rounded-xl bg-white shadow-none">
            <CardContent className="py-5 px-3 text-center space-y-1.5">
              <div className="flex justify-center items-center gap-1.5 text-[var(--muted-foreground)]">
                {stat.icon}
                <p className="text-[10px] font-bold uppercase tracking-widest leading-none">
                  {stat.label}
                </p>
              </div>
              <p className={`text-xl font-black ${stat.color ?? "text-[var(--foreground)]"}`}>
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary Stats (Skipped, Time, Rank, Percentile) */}
      {secondaryStats.length > 0 && (
        <div className={`grid gap-4 ${secondaryStats.length <= 2 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4"}`}>
          {secondaryStats.map((stat) => (
            <Card key={stat.label} className="border border-[var(--border)]/60 bg-[var(--card)]">
              <CardContent className="py-4 px-3 text-center space-y-1.5">
                <div className="flex justify-center items-center gap-1.5 text-[var(--muted-foreground)]">
                  {stat.icon}
                  <p className="text-[10px] font-bold uppercase tracking-widest leading-none">
                    {stat.label}
                  </p>
                </div>
                <p className={`text-lg font-black ${(stat as any).color ?? "text-[var(--foreground)]"}`}>
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Feedback / Remarks */}
      {feedback && (
        <Card className="border border-[var(--color-primary-200)] bg-[var(--color-primary-50)]/40">
          <CardContent className="p-5 flex items-start gap-3">
            <div className="h-8 w-8 shrink-0 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center mt-0.5">
              <MessageSquare className="h-4 w-4 text-[var(--color-primary-600)]" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-primary-600)] mb-1">
                Performance Feedback
              </p>
              <p className="text-sm text-[var(--foreground)] leading-relaxed">{feedback}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href={`/tests/session/${params.sessionId}/solutions`} className="flex-1">
          <Button className="w-full h-11 gap-2 font-semibold bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] rounded-lg">
            <BookOpen className="h-4 w-4" /> View Solutions
          </Button>
        </Link>
        <Link href={ROUTES.TESTS} className="flex-1">
          <Button variant="outline" className="w-full h-11 gap-2 font-semibold border-[var(--border)] text-[var(--foreground)] bg-white rounded-lg hover:border-[var(--color-primary-600)] hover:text-[var(--color-primary-600)]">
            <LayoutDashboard className="h-4 w-4" /> Back to Tests
          </Button>
        </Link>
      </div>

      <div className="pt-2 flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          className="text-[var(--muted-foreground)] gap-2 hover:text-[var(--foreground)]"
        >
          <Share2 className="h-4 w-4" /> Share Result
        </Button>
      </div>
    </div>
  );
}
