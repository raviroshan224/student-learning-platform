export type LectureType = "video" | "pdf" | "quiz";

export interface Lecture {
  id: string;
  courseId: string;
  sectionId: string;
  title: string;
  description?: string;
  type: LectureType;
  videoUrl?: string;
  pdfUrl?: string;
  duration: number; // seconds
  isPreview: boolean;
  isCompleted?: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface LectureDetail extends Lecture {
  notes?: string;
  resources: Array<{ title: string; url: string; type: string }>;
  watchPosition?: number; // seconds
}

export interface CreateLecturePayload {
  courseId: string;
  sectionId: string;
  title: string;
  description?: string;
  type: LectureType;
  isPreview?: boolean;
  order?: number;
}

export interface UpdateLecturePayload extends Partial<Omit<CreateLecturePayload, "courseId">> {}

export interface WatchProgressPayload {
  position: number; // seconds watched
  completed?: boolean;
}
