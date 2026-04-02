import { useQuery } from "@tanstack/react-query";
import { CoursesService } from "@/services/api/courses.service";

export function useCourseList(params?: { page?: number; limit?: number; search?: string; categoryId?: string }) {
  return useQuery({
    queryKey: ["courses-list", params],
    queryFn: () => CoursesService.list(params).then((r) => r.data),
  });
}
