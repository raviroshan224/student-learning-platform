export type MaterialType = "pdf" | "doc" | "ppt" | "zip" | "other";

export interface CourseMaterial {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileSize?: number; // bytes
  type: MaterialType;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaterialPayload {
  courseId: string;
  title: string;
  description?: string;
  isPublic?: boolean;
}
