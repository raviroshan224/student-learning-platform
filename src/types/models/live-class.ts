export type LiveClassStatus = "scheduled" | "live" | "ended" | "cancelled";

export interface LiveClass {
  id: string;
  title: string;
  description?: string;
  courseId?: string;
  instructorId: string;
  instructorName: string;
  instructorAvatar?: string;
  thumbnail?: string;
  scheduledAt: string;
  duration?: number; // minutes, estimated
  status: LiveClassStatus;
  joinUrl?: string;
  recordingUrl?: string;
  viewerCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LiveClassJoinToken {
  token: string;
  joinUrl: string;
  expiresAt: string;
}

export interface LiveClassQueryParams {
  page?: number;
  limit?: number;
  status?: LiveClassStatus;
  courseId?: string;
}

export interface CreateLiveClassPayload {
  title: string;
  description?: string;
  courseId?: string;
  scheduledAt: string;
  duration?: number;
}
