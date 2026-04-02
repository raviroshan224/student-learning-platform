import client from "./client";
import type { ApiResponse } from "@/types/api.types";
import type { Lecture, LectureDetail, CreateLecturePayload, UpdateLecturePayload } from "@/types/models/lecture";

export const LecturesService = {
  // ─── Student ────────────────────────────────────────────────────────────────
  getById: (id: string) =>
    client.get<ApiResponse<LectureDetail>>(`/lectures/${id}`),

  getNote: (id: string) =>
    client.get<ApiResponse<{ content: string }>>(`/lectures/${id}/notes`),

  saveNote: (id: string, content: string) =>
    client.post<ApiResponse<null>>(`/lectures/${id}/notes`, { content }),

  markComplete: (id: string) =>
    client.post<ApiResponse<null>>(`/lectures/${id}/complete`),

  // ─── Admin ──────────────────────────────────────────────────────────────────
  create: (payload: CreateLecturePayload) =>
    client.post<ApiResponse<Lecture>>("/lectures", payload),

  update: (id: string, payload: UpdateLecturePayload) =>
    client.patch<ApiResponse<Lecture>>(`/lectures/${id}`, payload),

  delete: (id: string) =>
    client.delete<ApiResponse<null>>(`/lectures/${id}`),

  uploadVideo: (id: string, file: File, onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append("video", file);
    return client.post<ApiResponse<{ videoUrl: string }>>(`/lectures/${id}/video`, form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: onProgress
        ? (e) => {
            if (e.total) onProgress(Math.round((e.loaded * 100) / e.total));
          }
        : undefined,
    });
  },

  replaceVideo: (id: string, file: File, onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append("video", file);
    return client.put<ApiResponse<{ videoUrl: string }>>(`/lectures/${id}/video`, form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: onProgress
        ? (e) => {
            if (e.total) onProgress(Math.round((e.loaded * 100) / e.total));
          }
        : undefined,
    });
  },

  uploadPdf: (id: string, file: File) => {
    const form = new FormData();
    form.append("pdf", file);
    return client.post<ApiResponse<{ pdfUrl: string }>>(`/lectures/${id}/pdf`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
