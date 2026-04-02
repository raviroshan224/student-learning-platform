import type { CategoryModel } from "@/types/models/category";
import type { SubjectModel, LectureModel, CourseDetailsResponse } from "@/types/models/course";

export const CDN_BASE = "https://olp-uploads.s3.us-east-1.amazonaws.com/";

export function resolveImageUrl(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  if (raw.startsWith("http")) return raw;
  return CDN_BASE + (raw.startsWith("/") ? raw.slice(1) : raw);
}

export function normalizeHasOffer(raw: unknown): boolean {
  if (typeof raw === "boolean") return raw;
  if (raw === 1 || raw === "1" || raw === "true") return true;
  return false;
}

export function getCourseBadge(course: {
  enrollmentCost?: number;
  discountedPrice?: number;
  hasOffer?: unknown;
}): { type: "FREE" | "DISCOUNT" | "NONE"; label?: string } {
  const isFree = (course.enrollmentCost ?? 0) === 0;
  if (isFree) return { type: "FREE" };

  const hasDiscount =
    normalizeHasOffer(course.hasOffer) &&
    course.discountedPrice != null &&
    course.enrollmentCost != null &&
    course.enrollmentCost > course.discountedPrice;

  if (hasDiscount) {
    const pct = Math.round(
      ((course.enrollmentCost! - course.discountedPrice!) / course.enrollmentCost!) * 100
    );
    return { type: "DISCOUNT", label: `${pct}% OFF` };
  }
  return { type: "NONE" };
}

export function flattenToLeafCategories(categories: any[]): any[] {
  const result: any[] = [];
  function traverse(cats: any[]) {
    for (const cat of cats) {
      if (!cat.children || cat.children.length === 0) {
        result.push(cat);
      } else {
        traverse(cat.children);
      }
    }
  }
  traverse(categories);
  return result;
}

export function computeLiveClassStatus(cls: {
  startTime?: string;
  endTime?: string;
  scheduledAt?: string;
  durationMinutes?: number;
}) {
  const now = new Date();
  // Support both startTime/endTime and scheduledAt/durationMinutes
  const start = cls.startTime
    ? new Date(cls.startTime)
    : cls.scheduledAt
    ? new Date(cls.scheduledAt)
    : null;
  const end = cls.endTime
    ? new Date(cls.endTime)
    : start && cls.durationMinutes
    ? new Date(start.getTime() + cls.durationMinutes * 60 * 1000)
    : null;

  const isJoinable = start != null && end != null && now >= start && now <= end;
  const isUpcoming = start != null && start > now;
  const hasEnded = end != null && end < now;

  let displayStatus = "Live now";
  if (isUpcoming) displayStatus = "Starts soon";
  if (hasEnded) displayStatus = "Completed";

  return { isJoinable, isUpcoming, hasEnded, displayStatus };
}

export function getExpiryLabel(expiryDate?: string | null): string | null {
  if (!expiryDate) return null;
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffDays = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 0) return `Expires In: ${diffDays} Days`;
  if (diffDays === 0) return "Expires Today";
  return "Expired";
}

export function groupLecturesBySubject(
  lectures: LectureModel[],
  subjects: SubjectModel[]
): Array<{ title: string; lectures: LectureModel[] }> {
  const grouped = new Map<string, LectureModel[]>();
  for (const s of subjects) grouped.set(s.id, []);
  for (const lec of lectures) {
    const key = lec.subjectId || "_uncategorized";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(lec);
  }
  const result: Array<{ title: string; lectures: LectureModel[] }> = [];
  for (const s of subjects) {
    const lecs = grouped.get(s.id) ?? [];
    if (lecs.length > 0)
      result.push({ title: s.subjectName ?? s.subjectTitle ?? "Subject", lectures: lecs });
  }
  const uncategorized = grouped.get("_uncategorized") ?? [];
  if (uncategorized.length > 0)
    result.push({ title: "General Lectures", lectures: uncategorized });
  return result;
}

export function formatDurationSeconds(seconds?: number | null): string {
  if (!seconds) return "";
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  }
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  return `${seconds}s`;
}

export function getCourseIsEnrolled(details: CourseDetailsResponse | null): boolean {
  if (!details) return false;
  if (details.isEnrolled === true) return true;
  const status = details.enrollmentDetails?.status?.toLowerCase();
  return status === "active" || status === "completed";
}

export function getEnrollCTA(
  details: CourseDetailsResponse | null
): "FREE_ENROLL" | "ESEWA_PAYMENT" | "NONE" {
  if (!details || getCourseIsEnrolled(details)) return "NONE";
  const effectivePrice =
    normalizeHasOffer(details.hasOffer) && details.discountedPrice != null
      ? details.discountedPrice
      : details.enrollmentCost ?? 0;
  return effectivePrice <= 0 ? "FREE_ENROLL" : "ESEWA_PAYMENT";
}
