import { useQuery } from "@tanstack/react-query";
import { DashboardService } from "@/services/api/dashboard.service";
import { queryKeys } from "@/services/query/keys";

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: () => DashboardService.getStats().then((r) => r.data.data),
  });
}

export function useContinueLearning() {
  return useQuery({
    queryKey: queryKeys.dashboard.continueLearning(),
    queryFn: () => DashboardService.getContinueLearning().then((r) => r.data.data),
  });
}
