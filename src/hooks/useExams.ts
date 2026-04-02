import { useQuery, useMutation } from '@tanstack/react-query';
import { ExamsService } from '@/services/api/exams.service';

export function useExamList(params?: Parameters<typeof ExamsService.list>[0]) {
  return useQuery({
    queryKey: ['exams', params],
    queryFn: () => ExamsService.list(params).then((r) => r.data),
  });
}

export function useExamDetail(id: string) {
  return useQuery({
    queryKey: ['exam', id],
    queryFn: () => ExamsService.detail(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useMockTests(courseId: string) {
  return useQuery({
    queryKey: ['mock-tests', courseId],
    queryFn: () => ExamsService.mockTests(courseId).then((r) => r.data),
    enabled: !!courseId,
  });
}

export function useStartTestSession() {
  return useMutation({
    mutationFn: (mockTestId: string) => ExamsService.startSession(mockTestId).then((r) => r.data),
  });
}

export function useTestHistory() {
  return useQuery({
    queryKey: ['test-history'],
    queryFn: () => ExamsService.sessionHistory().then((r) => r.data),
  });
}
