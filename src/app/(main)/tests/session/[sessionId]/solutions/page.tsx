"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { 
    CheckCircle2, 
    XCircle, 
    HelpCircle, 
    ArrowLeft, 
    Info, 
    ChevronLeft,
    ClipboardCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExamsService } from "@/services/api/exams.service";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants/routes";

function unwrap<T>(raw: any): T {
  if (raw && typeof raw === "object") {
    if ("data" in raw && raw.data !== undefined) return raw.data as T;
    if ("result" in raw && raw.result !== undefined) return raw.result as T;
  }
  return raw as T;
}

export default function SolutionsPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const { sessionId } = params;

  const { data: solutionsRaw, isLoading } = useQuery({
    queryKey: ["session-solutions", sessionId],
    queryFn: () => ExamsService.solutions(sessionId).then((r) => unwrap<any>(r.data)),
  });

  // API may return array directly or wrapped; normalise to array
  const solutions: any[] = Array.isArray(solutionsRaw)
    ? solutionsRaw
    : (solutionsRaw as any)?.solutions ?? (solutionsRaw as any)?.data ?? [];

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pt-6">
        <Skeleton className="h-10 w-1/4" />
        {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-4 pb-20">
      <div className="flex items-center justify-between gap-4 sticky top-[var(--topbar-height)] bg-[var(--background)]/80 backdrop-blur-md py-2 z-10">
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1.5 -ml-2 text-[var(--muted-foreground)]">
                <ChevronLeft className="h-4 w-4" /> Back to Result
            </Button>
            <h1 className="text-xl font-bold tracking-tight">Review Solutions</h1>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold text-[var(--muted-foreground)] uppercase">
            <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-sm bg-[var(--color-success)]/20 border border-[var(--color-success)]/40" /> Correct
            </div>
            <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-sm bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30" /> Incorrect
            </div>
        </div>
      </div>

      <div className="space-y-6">
        {(!solutions || solutions.length === 0) ? (
            <div className="py-20 text-center space-y-4">
                <Info className="h-12 w-12 mx-auto text-[var(--muted-foreground)] opacity-30" />
                <h2 className="text-xl font-bold">No Solutions Available</h2>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        ) : (
            solutions.map((sol: any, idx: number) => {
                // Normalise field names — mobile uses correctOptionKey / selectedAnswerKey
                const correctKey = sol.correctAnswer ?? sol.correctOptionKey ?? sol.correctAnswerKey;
                const selectedKey = sol.selectedAnswer ?? sol.selectedAnswerKey ?? sol.selectedOption;
                const questionText =
                  sol.text ?? sol.questionText ??
                  sol.question?.prompt ?? sol.question?.questionText ??
                  sol.question?.text ?? "";
                const options: any[] = Array.isArray(sol.options)
                  ? sol.options
                  : Object.entries(sol.options ?? {}).map(([key, label]) => ({ key, label }));

                return (
                    <Card key={sol.questionId || idx} className={cn(
                        "overflow-hidden border-2 transition-shadow hover:shadow-md",
                        sol.isCorrect ? "border-[var(--color-success)]/10" : selectedKey ? "border-[var(--color-danger)]/10" : "border-[var(--border)]"
                    )}>
                        <CardContent className="p-0">
                            {/* Question Header */}
                            <div className="p-5 border-b border-[var(--border)] bg-[var(--muted)]/20">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="h-6 px-2 text-[10px] font-bold uppercase tracking-wider">
                                                Question {idx + 1}
                                            </Badge>
                                            {sol.marks != null && (
                                              <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
                                                  {sol.marks} Marks
                                              </span>
                                            )}
                                        </div>
                                        <p className="font-bold text-base leading-relaxed text-[var(--foreground)]">
                                            {questionText}
                                        </p>
                                    </div>
                                    <div className="shrink-0 flex flex-col items-end gap-1">
                                        {sol.isCorrect ? (
                                            <div className="flex items-center gap-1.5 text-[var(--color-success)] font-bold text-xs uppercase tracking-tight">
                                                <CheckCircle2 className="h-4 w-4" /> Correct
                                            </div>
                                        ) : selectedKey ? (
                                            <div className="flex items-center gap-1.5 text-[var(--color-danger)] font-bold text-xs uppercase tracking-tight">
                                                <XCircle className="h-4 w-4" /> Incorrect
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-[var(--muted-foreground)] font-bold text-xs uppercase tracking-tight">
                                                <HelpCircle className="h-4 w-4" /> Skipped
                                            </div>
                                        )}
                                        {sol.marks != null && (
                                          <span className={cn(
                                              "text-[10px] font-extrabold uppercase",
                                              sol.isCorrect ? "text-[var(--color-success)]" : "text-[var(--muted-foreground)]"
                                          )}>
                                              Score: {sol.marksEarned ?? 0}/{sol.marks}
                                          </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Options */}
                            <div className="p-5 space-y-3">
                                {options.map((opt: any, oi: number) => {
                                    // Mobile options use key/label; old web used id/text
                                    const optKey = opt.key ?? opt.id ?? String.fromCharCode(65 + oi);
                                    const optText = opt.label ?? opt.text ?? String(opt);
                                    const isCorrect = optKey === correctKey;
                                    const isSelected = optKey === selectedKey;
                                    
                                    return (
                                        <div key={optKey} className={cn(
                                            "flex items-start gap-3 p-4 rounded-xl border transition-all",
                                            isCorrect
                                                ? "bg-[var(--color-success)]/10 border-[var(--color-success)]/30"
                                                : isSelected
                                                    ? "bg-[var(--color-danger)]/5 border-[var(--color-danger)]/20"
                                                    : "bg-[var(--muted)]/30 border-transparent"
                                        )}>
                                            <div className={cn(
                                                "h-8 w-8 shrink-0 flex items-center justify-center rounded-lg border text-sm font-bold shadow-sm",
                                                isCorrect
                                                    ? "bg-white border-[var(--color-success)]/50 text-[var(--color-success)]"
                                                    : isSelected
                                                        ? "bg-white border-[var(--color-danger)]/50 text-[var(--color-danger)]"
                                                        : "bg-white border-[var(--border)] text-[var(--muted-foreground)]"
                                            )}>
                                                {String.fromCharCode(65 + oi)}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <p className={cn(
                                                    "text-sm font-medium",
                                                    isCorrect ? "text-[var(--color-success)]" : isSelected ? "text-[var(--color-danger)]" : "text-[var(--foreground)]"
                                                )}>
                                                    {optText}
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {isCorrect && (
                                                        <Badge variant="secondary" className="bg-[var(--color-success)]/20 text-[var(--color-success)] border-[var(--color-success)]/30 text-[9px] font-bold uppercase py-0 px-1.5">
                                                            Correct Answer
                                                        </Badge>
                                                    )}
                                                    {isSelected && !isCorrect && (
                                                        <Badge variant="secondary" className="bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/20 text-[9px] font-bold uppercase py-0 px-1.5">
                                                            Your Selection
                                                        </Badge>
                                                    )}
                                                    {isSelected && isCorrect && (
                                                        <Badge variant="secondary" className="bg-[var(--color-success)]/20 text-[var(--color-success)] border-[var(--color-success)]/30 text-[9px] font-bold uppercase py-0 px-1.5">
                                                            Your Selection
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Explanation */}
                            {(sol.explanation || correctKey) && (
                                <div className="p-5 border-t border-[var(--border)] bg-[var(--muted)]/5 space-y-3">
                                    <div className="flex items-center gap-1.5 text-[var(--color-primary-600)]">
                                        <ClipboardCheck className="h-4 w-4" />
                                        <h4 className="text-xs font-extrabold uppercase tracking-widest leading-none">Detailed Explanation</h4>
                                    </div>
                                    <p className="text-sm text-[var(--muted-foreground)] leading-relaxed italic">
                                        {sol.explanation || "The correct concept involves verifying the logical outcome through standard practices."}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            })
        )}
      </div>

      <div className="flex justify-center pt-8">
        <Button size="lg" className="rounded-full shadow-lg font-bold px-8 h-12" onClick={() => router.push(ROUTES.TESTS)}>
            Return to Dashboard
        </Button>
      </div>
    </div>
  );
}
