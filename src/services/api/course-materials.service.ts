import client from "./client";
import type { ApiResponse } from "@/types/api.types";
import type { CourseMaterial, CreateMaterialPayload } from "@/types/models/course-material";

export const CourseMaterialsService = {
  // ─── Student ────────────────────────────────────────────────────────────────
  getByCourse: (courseId: string) =>
    client.get<ApiResponse<CourseMaterial[]>>(`/courses/${courseId}/materials`),

  download: (materialId: string) =>
    client.get<Blob>(`/materials/${materialId}/download`, { responseType: "blob" }),

  // ─── Admin ──────────────────────────────────────────────────────────────────
  create: (payload: CreateMaterialPayload, file: File) => {
    const form = new FormData();
    form.append("file", file);
    form.append("title", payload.title);
    if (payload.description) form.append("description", payload.description);
    if (payload.isPublic !== undefined) form.append("isPublic", String(payload.isPublic));
    return client.post<ApiResponse<CourseMaterial>>(`/courses/${payload.courseId}/materials`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  update: (materialId: string, payload: Partial<Omit<CreateMaterialPayload, "courseId">>) =>
    client.patch<ApiResponse<CourseMaterial>>(`/materials/${materialId}`, payload),

  delete: (materialId: string) =>
    client.delete<ApiResponse<null>>(`/materials/${materialId}`),
};
