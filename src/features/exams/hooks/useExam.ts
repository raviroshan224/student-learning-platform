import { useQuery } from "@tanstack/react-query";
import { ExamsService } from "@/services/api/exams.service";

export function useExamList(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ["exams-list", params],
    queryFn: () => ExamsService.list(params).then((r) => r.data),
  });
}

export function useTestHistory() {
  return useQuery({
    queryKey: ["test-history"],
    queryFn: () => ExamsService.sessionHistory().then((r) => r.data),
  });
}
