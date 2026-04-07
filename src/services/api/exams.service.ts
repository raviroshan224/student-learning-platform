import client from './client';
import type { ExamModel, MockTestModel, TestSessionModel, TestAttemptResult, SessionSummary, SessionSolution } from '@/types/models/exam';

export const ExamsService = {
  list: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    category?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => client.get<{ data: ExamModel[]; meta: any }>("/exams", { params }),
  detail: (id: string) => client.get<ExamModel>(`/exams/${id}`),
  mockTests: (courseId: string) =>
    client.get<MockTestModel[]>(`/mock-tests/courses/${courseId}/with-attempts`),
  startSession: (mockTestId: string) =>
    client.post<TestSessionModel>("/test-sessions/start", { mockTestId }),
  unlockTest: (mockTestId: string, courseId?: string) =>
    client.post("/mock-purchases/purchase-test", { mockTestId, courseId }),
  getSession: (sessionId: string) =>
    client.get<TestSessionModel>(`/test-sessions/${sessionId}`),
  getQuestion: (sessionId: string, questionIndex: number) =>
    client.get<any>(`/test-sessions/${sessionId}/question/${questionIndex}`),
  answer: (sessionId: string, payload: { questionIndex: number; selectedAnswer: string }) =>
    client.patch(`/test-sessions/${sessionId}/answer`, payload),
  markReview: (sessionId: string, payload: { questionIndex: number; markForReview: boolean }) =>
    client.patch(`/test-sessions/${sessionId}/mark-review`, payload),
  navigate: (sessionId: string, payload: { questionIndex: number }) =>
    client.patch(`/test-sessions/${sessionId}/navigate`, payload),
  summary: (sessionId: string) =>
    client.get<any>(`/test-sessions/${sessionId}/summary`),
  submitSession: (sessionId: string) =>
    client.post<TestAttemptResult>(`/test-sessions/${sessionId}/submit`),
  sessionResult: (sessionId: string) =>
    client.get<TestAttemptResult>(`/test-sessions/${sessionId}/result`),
  solutions: (sessionId: string) =>
    client.get<SessionSolution[]>(`/test-sessions/${sessionId}/solutions`),
  sessionHistory: (courseId?: string) =>
    client.get<TestAttemptResult[]>("/test-sessions/history/me", { params: { courseId } }),
};
