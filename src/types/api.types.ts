export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  errors?: Record<string, string> | { field: string; message: string };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
/**
 * The real API returns token/refreshToken directly (NOT inside a `data` wrapper)
 * POST /api/v1/auth/email/login → { token, refreshToken, tokenExpires, user }
 */
export interface AuthTokens {
  token: string;
  refreshToken: string;
  tokenExpires: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
