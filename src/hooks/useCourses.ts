import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CoursesService } from '@/services/api/courses.service';

export function useCourseList(params?: Parameters<typeof CoursesService.list>[0]) {
  return useQuery({
    queryKey: ['courses', params],
    queryFn: () => CoursesService.list(params).then((r) => r.data),
  });
}

export function useCourseDetail(id: string) {
  return useQuery({
    queryKey: ['course', id],
    queryFn: () => CoursesService.detail(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useSavedCourses() {
  return useQuery({
    queryKey: ['saved-courses'],
    queryFn: () => CoursesService.savedMyCourses(),
  });
}

export function useToggleSave(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (isSaved: boolean) =>
      isSaved ? CoursesService.unsave(courseId) : CoursesService.save(courseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
      qc.invalidateQueries({ queryKey: ['course', courseId] });
      qc.invalidateQueries({ queryKey: ['saved-courses'] });
    },
  });
}

export function useCourseSubjects(courseId: string) {
  return useQuery({
    queryKey: ['course-subjects', courseId],
    queryFn: () => CoursesService.subjects(courseId).then((r) => r.data),
    enabled: !!courseId,
  });
}

export function useCourseDetail2(courseId: string) {
  return useQuery({
    queryKey: ['course-detail', courseId],
    queryFn: () => CoursesService.detail(courseId).then((r) => r.data),
    enabled: !!courseId,
  });
}
