import client from './client';
import type { ExamModel, MockTestModel, TestSessionModel, TestAttemptResult } from '@/types/models/exam';

export const ExamsService = {
  list: (params?: { page?: number; limit?: number; search?: string; status?: string; category?: string; sortBy?: string; sortOrder?: string }) =>
    client.get<{ data: ExamModel[]; meta: any }>('/exams', { params }),
  detail: (id: string) => client.get<ExamModel>(`/exams/${id}`),
  mockTests: (courseId: string) =>
    client.get<MockTestModel[]>(`/mock-tests/courses/${courseId}/with-attempts`),
  startSession: (mockTestId: string) =>
    client.post<TestSessionModel>('/test-sessions/start', { mockTestId }),
  submitSession: (sessionId: string, answers: { questionId: string; selectedOptionId: string }[]) =>
    client.post<TestAttemptResult>(`/test-sessions/${sessionId}/submit`, { answers }),
  sessionResult: (sessionId: string) =>
    client.get<TestAttemptResult>(`/test-sessions/${sessionId}/result`),
  sessionHistory: () => client.get<TestAttemptResult[]>('/test-sessions/history/me'),
};
