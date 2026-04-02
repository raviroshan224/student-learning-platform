import client from "./client";
import type { ApiResponse } from "@/types/api.types";

export interface DashboardStats {
  enrolledCourses: number;
  completedCourses: number;
  totalHoursLearned: number;
  examsPassed: number;
  currentStreak: number;
  certificates: number;
}

export interface CourseProgress {
  courseId: string;
  title: string;
  thumbnail: string;
  progress: number;
  lastLectureTitle: string;
  lastLectureId: string;
}

export const DashboardService = {
  getStats: () =>
    client.get<ApiResponse<DashboardStats>>("/dashboard/stats"),

  getContinueLearning: () =>
    client.get<ApiResponse<CourseProgress[]>>("/dashboard/continue-learning"),

  getRecentResults: () =>
    client.get<ApiResponse<unknown[]>>("/dashboard/recent-results"),
};
