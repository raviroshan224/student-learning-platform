import client from "./client";
import type { ApiResponse } from "@/types/api.types";

export interface UploadedFile {
  id: string;
  url: string;
  filename: string;
  mimetype: string;
  size: number;
  createdAt: string;
}

export const FilesService = {
  upload: (file: File, folder?: string) => {
    const form = new FormData();
    form.append("file", file);
    if (folder) form.append("folder", folder);
    return client.post<ApiResponse<UploadedFile>>("/files/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  delete: (fileId: string) =>
    client.delete<ApiResponse<null>>(`/files/${fileId}`),
};
