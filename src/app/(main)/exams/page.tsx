"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Search, ClipboardList, BookOpen, ChevronRight, LayoutGrid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExamsService } from "@/services/api/exams.service";
import { cn } from "@/lib/utils";
import Image from "next/image";

function resolveImageUrl(url?: string | null): string {
  if (!url) return "/placeholder-exam.jpg";
  if (url.startsWith("http")) return url;
  return `https://olp-uploads.s3.us-east-1.amazonaws.com/${url.startsWith("/") ? url.slice(1) : url}`;
}

export default function ExamsCataloguePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: examsData, isLoading } = useQuery({
    queryKey: ["exams-list", search],
    queryFn: () => ExamsService.list({ search, limit: 12 }).then((r) => r.data),
  });

  const exams = Array.isArray(examsData) ? examsData : (examsData as any)?.data ?? [];

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Exam Catalogue</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Explore curated exam packages and certification tests
          </p>
        </div>
        {/* View toggle */}
        <div className="flex items-center gap-1 bg-[var(--muted)] rounded-lg p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              viewMode === "grid"
                ? "bg-white text-[var(--foreground)] shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Grid
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              viewMode === "list"
                ? "bg-white text-[var(--foreground)] shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            )}
          >
            <List className="h-3.5 w-3.5" /> List
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-lg">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
        <Input
          placeholder="Search by title, category, or course..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-xl border-[var(--border)] bg-white focus-visible:ring-[var(--color-primary-600)]"
        />
      </div>

      {/* Skeleton */}
      {isLoading ? (
        <div className={cn(
          "gap-4",
          viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid grid-cols-1"
        )}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className={cn("rounded-xl", viewMode === "grid" ? "aspect-[4/3]" : "h-28")} />
          ))}
        </div>
      ) : exams.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <div className="h-16 w-16 rounded-2xl bg-[var(--color-primary-50)] flex items-center justify-center mx-auto">
            <ClipboardList className="h-8 w-8 text-[var(--color-primary-600)]/40" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--foreground)]">No exams found</h3>
          <p className="text-sm text-[var(--muted-foreground)]">Try adjusting your search terms.</p>
          <Button
            variant="outline"
            className="border-[var(--color-primary-600)] text-[var(--color-primary-600)] rounded-lg"
            onClick={() => setSearch("")}
          >
            Clear Search
          </Button>
        </div>
      ) : (
        <div className={cn(
          "gap-4",
          viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            : "flex flex-col"
        )}>
          {exams.map((exam: any) => (
            <div
              key={exam.id}
              className={cn(
                "group cursor-pointer bg-white border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--color-primary-600)] transition-colors",
                viewMode === "list" && "flex"
              )}
              onClick={() => router.push(`/exams/${exam.id}`)}
            >
              {/* Thumbnail */}
              <div className={cn(
                "relative bg-[var(--color-primary-50)] shrink-0",
                viewMode === "grid" ? "aspect-video" : "w-32 sm:w-48"
              )}>
                <Image
                  src={resolveImageUrl(exam.examImageUrl)}
                  alt={exam.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Content */}
              <div className={cn("p-4 flex flex-col justify-between flex-1", viewMode === "list" && "py-3 min-w-0")}>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-block text-[10px] font-semibold bg-[var(--color-primary-50)] text-[var(--color-primary-600)] px-2.5 py-0.5 rounded-full">
                      {exam.categoryName ?? exam.categoryId ?? "General"}
                    </span>
                    {exam.status === "active" && (
                      <div className="flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
                        <span className="text-[10px] font-bold text-[var(--color-success)] uppercase tracking-tight">Active</span>
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-[var(--foreground)] line-clamp-2 group-hover:text-[var(--color-primary-600)] transition-colors">
                    {exam.title}
                  </h3>
                  {viewMode === "list" && (
                    <p className="text-xs text-[var(--muted-foreground)] line-clamp-2">
                      Comprehensive certification exam. Includes access to multiple mock sessions.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1 text-[var(--muted-foreground)]">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">{exam.courseCount ?? 0} Courses</span>
                  </div>
                  <button className="flex items-center gap-1 text-xs font-semibold text-[var(--color-primary-600)] hover:underline">
                    Details <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
