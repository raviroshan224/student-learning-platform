import type { CourseQueryParams } from "@/types/models/course";
import type { UserQueryParams } from "@/types/models/user";
import type { CategoryQueryParams } from "@/types/models/category";
import type { MockTestQueryParams } from "@/types/models/mock-test";
import type { LiveClassQueryParams } from "@/types/models/live-class";
import type { PaymentQueryParams } from "@/types/models/payment";

export const queryKeys = {
  // ─── Auth / User ────────────────────────────────────────────────────────────
  user: {
    me: () => ["user", "me"] as const,
  },

  users: {
    all: () => ["users"] as const,
    list: (params: UserQueryParams) => ["users", "list", params] as const,
    detail: (id: string) => ["users", id] as const,
  },

  // ─── Categories ──────────────────────────────────────────────────────────────
  categories: {
    all: () => ["categories"] as const,
    list: (params?: CategoryQueryParams) => ["categories", "list", params] as const,
    detail: (id: string) => ["categories", id] as const,
    hierarchy: () => ["categories", "hierarchy"] as const,
    recommended: () => ["categories", "recommended"] as const,
  },

  // ─── Courses ─────────────────────────────────────────────────────────────────
  courses: {
    all: () => ["courses"] as const,
    list: (filters: CourseQueryParams) => ["courses", "list", filters] as const,
    detail: (id: string) => ["courses", "detail", id] as const,
    bySlug: (slug: string) => ["courses", "slug", slug] as const,
    progress: (id: string) => ["courses", "progress", id] as const,
    enrolled: () => ["courses", "enrolled"] as const,
    favorites: () => ["courses", "favorites"] as const,
    categories: () => ["courses", "categories"] as const,
    materials: (courseId: string) => ["courses", courseId, "materials"] as const,
  },

  // ─── Lectures ────────────────────────────────────────────────────────────────
  lectures: {
    detail: (id: string) => ["lectures", id] as const,
    note: (id: string) => ["lectures", id, "note"] as const,
    watchPosition: (courseId: string, lectureId: string) =>
      ["lectures", "watch", courseId, lectureId] as const,
  },

  // ─── Enrollments ─────────────────────────────────────────────────────────────
  enrollments: {
    progress: (courseId: string) => ["enrollments", "progress", courseId] as const,
  },

  // ─── Exams ───────────────────────────────────────────────────────────────────
  exams: {
    all: () => ["exams"] as const,
    list: (params?: Record<string, unknown>) => ["exams", "list", params] as const,
    detail: (id: string) => ["exams", id] as const,
    result: (id: string) => ["exams", "result", id] as const,
  },

  // ─── Mock Tests ──────────────────────────────────────────────────────────────
  mockTests: {
    all: () => ["mock-tests"] as const,
    list: (params?: MockTestQueryParams) => ["mock-tests", "list", params] as const,
    detail: (id: string) => ["mock-tests", id] as const,
  },

  // ─── Test Sessions ───────────────────────────────────────────────────────────
  testSessions: {
    session: (id: string) => ["test-sessions", id] as const,
    question: (sessionId: string, index: number) =>
      ["test-sessions", sessionId, "questions", index] as const,
    summary: (sessionId: string) => ["test-sessions", sessionId, "summary"] as const,
    result: (sessionId: string) => ["test-sessions", sessionId, "result"] as const,
    solutions: (sessionId: string) => ["test-sessions", sessionId, "solutions"] as const,
    history: () => ["test-sessions", "history"] as const,
  },

  // ─── Live Classes ────────────────────────────────────────────────────────────
  live: {
    all: () => ["live"] as const,
    list: (params?: LiveClassQueryParams) => ["live", "list", params] as const,
    detail: (id: string) => ["live", id] as const,
    // Legacy keys used in existing components
    sessions: () => ["live", "sessions"] as const,
    session: (id: string) => ["live", "sessions", id] as const,
  },

  // ─── Dashboard ───────────────────────────────────────────────────────────────
  dashboard: {
    stats: () => ["dashboard", "stats"] as const,
    continueLearning: () => ["dashboard", "continue-learning"] as const,
    recentResults: () => ["dashboard", "recent-results"] as const,
  },

  // ─── Homepage ────────────────────────────────────────────────────────────────
  homepage: {
    feed: () => ["homepage", "feed"] as const,
    search: (query: string) => ["homepage", "search", query] as const,
  },

  // ─── Analytics ───────────────────────────────────────────────────────────────
  analytics: {
    dashboard: () => ["analytics", "dashboard"] as const,
  },

  // ─── Payments ────────────────────────────────────────────────────────────────
  payments: {
    all: () => ["payments"] as const,
    list: (params?: PaymentQueryParams) => ["payments", "list", params] as const,
    detail: (id: string) => ["payments", id] as const,
  },

  // ─── Notifications ───────────────────────────────────────────────────────────
  notifications: {
    all: (type?: string) => ["notifications", type ?? "all"] as const,
    unreadCount: () => ["notifications", "unread-count"] as const,
  },
};
