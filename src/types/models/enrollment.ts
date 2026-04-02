export type EnrollmentStatus = "active" | "completed" | "cancelled";

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: EnrollmentStatus;
  progress: number; // 0-100
  completedLectures: string[];
  lastWatchedLectureId?: string;
  watchPosition?: number; // seconds
  enrolledAt: string;
  completedAt?: string;
}

export interface EnrollmentProgress {
  courseId: string;
  progress: number;
  completedLectures: string[];
  lastLectureId?: string;
  watchPosition?: number;
}

export interface WatchProgressPayload {
  lectureId: string;
  watchPosition: number;
}

