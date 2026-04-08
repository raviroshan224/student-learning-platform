import client from "./client";
import type { ApiResponse } from "@/types/api.types";
import type {
  TestSessionModel,
  QuestionResponseDto,
  SessionSummary,
  TestAttemptResult,
  SessionSolution,
  TestHistoryItem,
} from "@/types/models/exam";

export const TestSessionsService = {
  // Start a new test session for an exam
  start: (examId: string) =>
    client.post<ApiResponse<TestSessionModel>>("/test-sessions/start", { mockTestId: examId }),

  // Get current session info
  getSession: (sessionId: string) =>
    client.get<ApiResponse<TestSessionModel>>(`/test-sessions/${sessionId}`),

  // Get a specific question by index
  getQuestion: (sessionId: string, index: number) =>
    client.get<ApiResponse<QuestionResponseDto>>(`/test-sessions/${sessionId}/question/${index}`),

  // Submit an answer for a question
  answerQuestion: (sessionId: string, questionIndex: number, selectedAnswer: string) =>
    client.patch<ApiResponse<null>>(`/test-sessions/${sessionId}/answer`, { questionIndex, selectedAnswer }),

  // Mark/unmark a question for review
  markForReview: (sessionId: string, questionIndex: number, markForReview: boolean) =>
    client.patch<ApiResponse<null>>(`/test-sessions/${sessionId}/mark-review`, { questionIndex, markForReview }),

  // Navigate to a specific question index
  navigate: (sessionId: string, questionIndex: number) =>
    client.patch<ApiResponse<QuestionResponseDto>>(`/test-sessions/${sessionId}/navigate`, { questionIndex }),

  // Get the summary of all question statuses
  getSummary: (sessionId: string) =>
    client.get<ApiResponse<SessionSummary>>(`/test-sessions/${sessionId}/summary`),

  // Submit the session
  submit: (sessionId: string) =>
    client.post<ApiResponse<TestAttemptResult>>(`/test-sessions/${sessionId}/submit`),

  // Get result (after submission)
  getResult: (sessionId: string) =>
    client.get<ApiResponse<TestAttemptResult>>(`/test-sessions/${sessionId}/result`),

  // Get solutions with correct answers
  getSolutions: (sessionId: string) =>
    client.get<ApiResponse<SessionSolution[]>>(`/test-sessions/${sessionId}/solutions`),

  // Get session history for the current user
  getHistory: (params?: { page?: number; limit?: number; courseId?: string }) =>
    client.get<ApiResponse<TestHistoryItem[]>>("/test-sessions/history/me", { params }),
};
