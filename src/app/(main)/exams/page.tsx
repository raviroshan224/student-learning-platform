"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Search, Filter, ClipboardList, BookOpen, ChevronRight, LayoutGrid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Exam Catalogue</h1>
          <p className="text-[var(--muted-foreground)]">Explore our curated exam packages and certification tests.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode("grid")}
            className={cn(viewMode === "grid" && "bg-[var(--muted)]")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode("list")}
            className={cn(viewMode === "list" && "bg-[var(--muted)]")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
          <Input
            placeholder="Search by title, category, or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[var(--card)]"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" /> Filters
        </Button>
      </div>

      {/* List */}
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
          <ClipboardList className="h-12 w-12 mx-auto text-[var(--muted-foreground)] opacity-20" />
          <h3 className="text-lg font-semibold">No exams found</h3>
          <p className="text-[var(--muted-foreground)]">Try adjusting your search or filters.</p>
          <Button variant="outline" onClick={() => setSearch("")}>Clear Search</Button>
        </div>
      ) : (
        <div className={cn(
          "gap-4",
          viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-none" : "flex flex-col"
        )}>
          {exams.map((exam: any) => (
            <Card
              key={exam.id}
              className={cn(
                "group cursor-pointer hover:shadow-xl transition-all duration-300 border-[var(--border)] overflow-hidden",
                viewMode === "list" && "hover:border-[var(--color-primary-300)]"
              )}
              onClick={() => router.push(`/exams/${exam.id}`)}
            >
                <div className={cn("relative", viewMode === "list" ? "flex" : "flex flex-col")}>
                    {/* Thumbnail */}
                    <div className={cn(
                        "relative bg-[var(--muted)]/30 shrink-0",
                        viewMode === "grid" ? "aspect-video" : "w-32 h-full sm:w-48 sm:aspect-video"
                    )}>
                        <Image
                            src={resolveImageUrl(exam.examImageUrl)}
                            alt={exam.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <CardContent className={cn("p-4 flex flex-col justify-between flex-1", viewMode === "list" && "py-3 min-w-0")}>
                        <div className="space-y-2">
                             <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] uppercase font-bold tracking-wider">
                                    {exam.categoryName ?? exam.categoryId ?? "General"}
                                </Badge>
                                {exam.status === 'active' && (
                                    <div className="flex items-center gap-1">
                                        <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
                                        <span className="text-[10px] font-bold text-[var(--color-success)] uppercase tracking-tight">Active Now</span>
                                    </div>
                                )}
                             </div>

                             <div>
                                <h3 className="font-bold text-base line-clamp-1 group-hover:text-[var(--color-primary-600)] transition-colors">
                                    {exam.title}
                                </h3>
                                {viewMode === "list" && (
                                     <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 mt-1">
                                        Comprehensive certification exam for {exam.title}. Includes access to multiple mock sessions.
                                     </p>
                                )}
                             </div>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-1 text-[var(--muted-foreground)] text-xs font-medium">
                                <BookOpen className="h-3.5 w-3.5" />
                                <span>{exam.courseCount ?? 0} Courses</span>
                            </div>
                            <Button size="sm" variant="ghost" className="h-7 px-2 gap-1 text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)]">
                                Details <ChevronRight className="h-3 w-3" />
                            </Button>
                        </div>
                    </CardContent>
                </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
