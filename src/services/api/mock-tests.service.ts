import client from "./client";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { MockTest, CreateMockTestPayload, MockTestQueryParams } from "@/types/models/mock-test";

export const MockTestsService = {
  // ─── Student / Public ───────────────────────────────────────────────────────
  getAll: (params?: MockTestQueryParams) =>
    client.get<PaginatedResponse<MockTest>>("/mock-tests", { params }),

  getById: (id: string) =>
    client.get<ApiResponse<MockTest>>(`/mock-tests/${id}`),

  // ─── Admin ──────────────────────────────────────────────────────────────────
  create: (payload: CreateMockTestPayload) =>
    client.post<ApiResponse<MockTest>>("/mock-tests", payload),

  update: (id: string, payload: Partial<CreateMockTestPayload>) =>
    client.patch<ApiResponse<MockTest>>(`/mock-tests/${id}`, payload),

  publish: (id: string) =>
    client.post<ApiResponse<MockTest>>(`/mock-tests/${id}/publish`),

  archive: (id: string) =>
    client.post<ApiResponse<MockTest>>(`/mock-tests/${id}/archive`),

  delete: (id: string) =>
    client.delete<ApiResponse<null>>(`/mock-tests/${id}`),
};
