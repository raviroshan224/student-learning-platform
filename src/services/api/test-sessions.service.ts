import client from "./client";
import type { ApiResponse } from "@/types/api.types";
import type {
  TestSession,
  SessionQuestion,
  SessionSummary,
  SessionResult,
  SessionSolution,
  SessionHistoryItem,
} from "@/types/models/exam";

export const TestSessionsService = {
  // Start a new test session for an exam
  start: (examId: string) =>
    client.post<ApiResponse<TestSession>>("/test-sessions", { examId }),

  // Get current session info
  getSession: (sessionId: string) =>
    client.get<ApiResponse<TestSession>>(`/test-sessions/${sessionId}`),

  // Get a specific question by index
  getQuestion: (sessionId: string, index: number) =>
    client.get<ApiResponse<SessionQuestion>>(`/test-sessions/${sessionId}/questions/${index}`),

  // Submit an answer for a question
  answerQuestion: (sessionId: string, questionId: string, answer: string) =>
    client.post<ApiResponse<null>>(`/test-sessions/${sessionId}/answer`, { questionId, answer }),

  // Mark/unmark a question for review
  markForReview: (sessionId: string, questionId: string, marked: boolean) =>
    client.post<ApiResponse<null>>(`/test-sessions/${sessionId}/mark-review`, { questionId, marked }),

  // Navigate to a specific question index
  navigate: (sessionId: string, index: number) =>
    client.post<ApiResponse<SessionQuestion>>(`/test-sessions/${sessionId}/navigate`, { index }),

  // Get the summary of all question statuses
  getSummary: (sessionId: string) =>
    client.get<ApiResponse<SessionSummary>>(`/test-sessions/${sessionId}/summary`),

  // Submit the session
  submit: (sessionId: string) =>
    client.post<ApiResponse<SessionResult>>(`/test-sessions/${sessionId}/submit`),

  // Get result (after submission)
  getResult: (sessionId: string) =>
    client.get<ApiResponse<SessionResult>>(`/test-sessions/${sessionId}/result`),

  // Get solutions with correct answers
  getSolutions: (sessionId: string) =>
    client.get<ApiResponse<SessionSolution[]>>(`/test-sessions/${sessionId}/solutions`),

  // Get session history for the current user
  getHistory: (params?: { page?: number; limit?: number; examId?: string }) =>
    client.get<ApiResponse<SessionHistoryItem[]>>("/test-sessions/history", { params }),
};
