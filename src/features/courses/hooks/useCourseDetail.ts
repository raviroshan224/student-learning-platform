import { useQuery } from "@tanstack/react-query";
import { CoursesService } from "@/services/api/courses.service";

export function useCourseDetail(courseId: string) {
  return useQuery({
    queryKey: ["course-detail", courseId],
    queryFn: () => CoursesService.detail(courseId).then((r) => r.data),
    enabled: !!courseId,
  });
}
