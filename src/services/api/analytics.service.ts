import client from "./client";
import type { ApiResponse } from "@/types/api.types";
import type { AnalyticsDashboard } from "@/types/models/analytics";

export const AnalyticsService = {
  getDashboard: () =>
    client.get<ApiResponse<AnalyticsDashboard>>("/analytics/dashboard"),
};
