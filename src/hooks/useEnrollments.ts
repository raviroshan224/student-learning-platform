import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EnrollmentsService } from '@/services/api/enrollments.service';
import { CoursesService } from '@/services/api/courses.service';

export function useMyEnrollments() {
  return useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => EnrollmentsService.myCourses().then((r) => r.data),
  });
}

export function useEnrollFree() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => EnrollmentsService.enrollFree(courseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-enrollments'] });
    },
  });
}

export function useCompleteLecture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lectureId, courseId }: { lectureId: string; courseId: string }) =>
      CoursesService.completeLecture(lectureId),
    onSuccess: (_, { courseId }) => {
      qc.invalidateQueries({ queryKey: ['my-courses'] });
    },
  });
}
