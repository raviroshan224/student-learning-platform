import client from "./client";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { User, UserQueryParams } from "@/types/models/user";

export const UsersService = {
  getAll: (params?: UserQueryParams) =>
    client.get<PaginatedResponse<User>>("/users", { params }),

  getById: (id: string) =>
    client.get<ApiResponse<User>>(`/users/${id}`),

  update: (id: string, payload: Partial<User>) =>
    client.patch<ApiResponse<User>>(`/users/${id}`, payload),

  delete: (id: string) =>
    client.delete<ApiResponse<null>>(`/users/${id}`),
};
