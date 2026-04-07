"use client";

import { useState, useCallback, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, BookOpen, Bookmark, BookmarkCheck, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/lib/constants/routes";
import { CoursesService } from "@/services/api/courses.service";
import { resolveImageUrl, flattenToLeafCategories, getCourseBadge, normalizeHasOffer } from "@/lib/utils/course";
import { useDebounce } from "@/hooks/useDebounce";
import toast from "react-hot-toast";

// ─── Course Card ──────────────────────────────────────────────────────────────
function CourseCard({
  course,
  onBookmark,
  bookmarking,
}: {
  course: any;
  onBookmark: () => void;
  bookmarking: boolean;
}) {
  const img = resolveImageUrl(course.courseImageUrl);
  const badge = getCourseBadge(course);
  const isFree = badge.type === "FREE";
  const hasOffer = normalizeHasOffer(course.hasOffer);
  const displayPrice = hasOffer && course.discountedPrice != null
    ? course.discountedPrice
    : course.enrollmentCost;

  return (
    <div className="relative rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--card)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col group">
      <Link href={ROUTES.COURSE_DETAIL(course.id)} className="flex-1 flex flex-col">
        {/* Thumbnail */}
        <div className="relative bg-gradient-to-br from-[var(--color-primary-600)] to-[var(--color-primary-500)] overflow-hidden" style={{ aspectRatio: "16/9" }}>
          {img ? (
            <Image
              src={img}
              alt={course.courseTitle}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-white/40" />
            </div>
          )}
          {badge.type !== "NONE" && (
            <div className="absolute top-2 left-2">
              {badge.type === "FREE" ? (
                <span className="text-[10px] font-bold bg-[var(--color-success)] text-white px-1.5 py-0.5 rounded-full">FREE</span>
              ) : (
                <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">{badge.label}</span>
              )}
            </div>
          )}
          {course.categoryName && (
            <div className="absolute bottom-2 left-2">
              <Badge className="text-[9px] bg-black/50 text-white border-0 backdrop-blur-sm px-1.5 py-0.5">
                {course.categoryName}
              </Badge>
            </div>
          )}
        </div>
        {/* Info */}
        <div className="p-3 flex-1 flex flex-col gap-1.5">
          <p className="text-xs font-semibold line-clamp-2 leading-snug text-[var(--foreground)] group-hover:text-[var(--color-primary-700)] transition-colors">
            {course.courseTitle}
          </p>
          <div className="mt-auto flex items-baseline gap-1.5">
            {isFree ? (
              <span className="text-xs font-bold text-[var(--color-success)]">Free</span>
            ) : (
              <>
                <span className="text-xs font-bold text-[var(--color-primary-600)]">
                  Rs {(displayPrice ?? course.enrollmentCost)?.toLocaleString()}
                </span>
                {hasOffer && course.enrollmentCost != null && course.discountedPrice != null && (
                  <span className="text-[10px] text-[var(--muted-foreground)] line-through">
                    Rs {course.enrollmentCost.toLocaleString()}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </Link>
      {/* Bookmark */}
      <button
        onClick={(e) => { e.preventDefault(); onBookmark(); }}
        disabled={bookmarking}
        className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:bg-white transition-colors disabled:opacity-50"
        aria-label={course.isSaved ? "Unsave" : "Save"}
      >
        {course.isSaved ? (
          <BookmarkCheck className="h-3.5 w-3.5 text-[var(--color-primary-600)]" />
        ) : (
          <Bookmark className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
        )}
      </button>
    </div>
  );
}

// ─── Skeleton Grid ────────────────────────────────────────────────────────────
function CourseGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--card)]">
          <Skeleton className="w-full" style={{ aspectRatio: "16/9" }} />
          <div className="p-3 space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Explore Content ─────────────────────────────────────────────────────
function ExploreContent() {
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    searchParams.get("categoryId")
  );
  const [bookmarkingId, setBookmarkingId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(searchInput, 300);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Categories
  const { data: categoriesRaw } = useQuery({
    queryKey: ["courses-categories"],
    queryFn: () => CoursesService.categories().then((r) => r.data),
    staleTime: 1000 * 60 * 30,
  });
  const leafCategories: any[] = categoriesRaw ? flattenToLeafCategories(
    Array.isArray(categoriesRaw) ? categoriesRaw : (categoriesRaw as any)?.data ?? []
  ) : [];

  // Infinite courses
  const search = debouncedSearch.length >= 2 || debouncedSearch.length === 0 ? debouncedSearch : "";
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["courses-explore-infinite", search, selectedCategoryId],
    queryFn: ({ pageParam = 1 }) =>
      CoursesService.list({ page: pageParam as number, limit: 12, search: search || undefined, categoryId: selectedCategoryId || undefined })
        .then((r) => r.data),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) =>
      lastPage?.meta?.hasNext ? (lastPage.meta.page ?? 1) + 1 : undefined,
    staleTime: 1000 * 60 * 2,
  });

  const courses = data?.pages.flatMap((p: any) =>
    Array.isArray(p) ? p : (p?.data ?? [])
  ) ?? [];

  // Intersection observer for infinite scroll (120px before bottom)
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
        },
        { rootMargin: "120px" }
      );
      if (node) observerRef.current.observe(node);
    },
    [isFetchingNextPage, fetchNextPage, hasNextPage]
  );

  async function toggleSave(course: any) {
    setBookmarkingId(course.id);
    try {
      if (course.isSaved) {
        await CoursesService.unsave(course.id);
      } else {
        await CoursesService.save(course.id);
      }
      qc.invalidateQueries({ queryKey: ["courses-explore-infinite"] });
    } catch {
      toast.error("Failed to update saved courses");
    } finally {
      setBookmarkingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-[var(--foreground)]">Explore Courses</h1>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search courses..."
          className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] pl-9 pr-9 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-400)] focus:border-[var(--color-primary-400)] transition-all"
        />
        {searchInput && (
          <button
            onClick={() => setSearchInput("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setSelectedCategoryId(null)}
          className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
            !selectedCategoryId
              ? "bg-[var(--color-primary-600)] text-white shadow-sm"
              : "bg-[var(--color-primary-600)]/10 text-[var(--color-primary-700)]"
          }`}
        >
          All Courses
        </button>
        {leafCategories.map((cat) => {
          const catId = cat.categoryId ?? cat.id;
          return (
          <button
            key={catId}
            onClick={() => setSelectedCategoryId(selectedCategoryId === catId ? null : catId)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              selectedCategoryId === catId
                ? "bg-[var(--color-primary-600)] text-white shadow-sm"
                : "bg-[var(--color-primary-600)]/10 text-[var(--color-primary-700)]"
            }`}
          >
            {cat.categoryName ?? cat.name}
          </button>
          );
        })}
      </div>

      {/* Grid */}
      {isLoading ? (
        <CourseGridSkeleton />
      ) : error ? (
        <div className="py-16 text-center text-[var(--muted-foreground)]">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Failed to load courses</p>
          <button onClick={() => refetch()} className="mt-2 text-sm text-[var(--color-primary-600)] hover:underline">
            Retry
          </button>
        </div>
      ) : courses.length === 0 ? (
        <div className="py-16 text-center text-[var(--muted-foreground)]">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No courses found</p>
          <p className="text-sm mt-1">Try a different search or category</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((course: any) => (
              <CourseCard
                key={course.id}
                course={course}
                onBookmark={() => toggleSave(course)}
                bookmarking={bookmarkingId === course.id}
              />
            ))}
          </div>
          {/* Infinite scroll trigger */}
          <div ref={loadMoreRef} className="h-1" />
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <div className="h-6 w-6 rounded-full border-2 border-[var(--color-primary-600)] border-t-transparent animate-spin" />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-full" />
          <div className="flex gap-2 overflow-hidden pb-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 shrink-0 rounded-full" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-[var(--radius-md)]" />
            ))}
          </div>
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
