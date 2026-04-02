"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, XCircle, Award, BookOpen } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExamsService } from "@/services/api/exams.service";
import { ROUTES } from "@/lib/constants/routes";

export default function TestResultPage() {
  const params = useParams<{ sessionId: string }>();

  const { data: resultRaw, isLoading } = useQuery({
    queryKey: ["session-result", params.sessionId],
    queryFn: () => ExamsService.sessionResult(params.sessionId).then((r) => r.data),
  });

  const result = resultRaw as any;

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto space-y-4 pt-8">
        <Skeleton className="h-32 w-full rounded-[var(--radius-lg)]" />
        <Skeleton className="h-48 w-full rounded-[var(--radius-lg)]" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center text-[var(--muted-foreground)]">
        <p className="font-medium">Result not available</p>
        <Link href={ROUTES.EXAMS} className="mt-4 inline-block">
          <Button size="sm">Back to Tests</Button>
        </Link>
      </div>
    );
  }

  const passed = result.passed ?? result.percentage >= 50;
  const percentage = result.percentage ?? 0;

  return (
    <div className="max-w-lg mx-auto space-y-6 pt-4">
      {/* Result Hero */}
      <Card
        className={`border-2 ${
          passed ? "border-[var(--color-success)]" : "border-[var(--color-danger)]"
        }`}
      >
        <CardContent className="py-8 text-center space-y-3">
          <div
            className={`mx-auto h-20 w-20 rounded-full flex items-center justify-center ${
              passed ? "bg-[var(--color-success)]/10" : "bg-[var(--color-danger)]/10"
            }`}
          >
            {passed ? (
              <Award className="h-10 w-10 text-[var(--color-success)]" />
            ) : (
              <XCircle className="h-10 w-10 text-[var(--color-danger)]" />
            )}
          </div>
          <div>
            <h1
              className={`text-2xl font-bold ${
                passed ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"
              }`}
            >
              {passed ? "Well Done!" : "Keep Practicing"}
            </h1>
            <p className="text-[var(--muted-foreground)] text-sm mt-1">
              {passed ? "You passed the test!" : "You did not meet the passing criteria."}
            </p>
          </div>
          <div className="text-5xl font-bold text-[var(--foreground)]">{percentage}%</div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Score", value: `${result.score ?? "-"}/${result.totalMarks ?? "-"}` },
          { label: "Percentage", value: `${percentage}%` },
          {
            label: "Correct",
            value: result.correctCount ?? "-",
            color: "text-[var(--color-success)]",
          },
          {
            label: "Incorrect",
            value: result.incorrectCount ?? "-",
            color: "text-[var(--color-danger)]",
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="py-4 text-center">
              <p className={`text-2xl font-bold ${stat.color ?? "text-[var(--foreground)]"}`}>
                {stat.value}
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link href={ROUTES.EXAMS} className="flex-1">
          <Button variant="outline" className="w-full gap-2">
            <BookOpen className="h-4 w-4" /> More Tests
          </Button>
        </Link>
        <Link href={ROUTES.DASHBOARD} className="flex-1">
          <Button className="w-full">Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
