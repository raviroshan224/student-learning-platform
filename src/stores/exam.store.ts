import { create } from "zustand";

interface ExamStore {
  examId: string | null;
  answers: Record<string, string | string[]>;
  flagged: string[];
  timeRemaining: number; // seconds
  isSubmitted: boolean;
  currentQuestion: number;
  startExam: (examId: string, durationMinutes: number) => void;
  setAnswer: (questionId: string, answer: string | string[]) => void;
  toggleFlag: (questionId: string) => void;
  goToQuestion: (index: number) => void;
  tick: () => void;
  submitExam: () => void;
  resetExam: () => void;
}

export const useExamStore = create<ExamStore>((set) => ({
  examId: null,
  answers: {},
  flagged: [],
  timeRemaining: 0,
  isSubmitted: false,
  currentQuestion: 0,

  startExam: (examId, durationMinutes) =>
    set({
      examId,
      answers: {},
      flagged: [],
      timeRemaining: durationMinutes * 60,
      isSubmitted: false,
      currentQuestion: 0,
    }),

  setAnswer: (questionId, answer) =>
    set((s) => ({ answers: { ...s.answers, [questionId]: answer } })),

  toggleFlag: (questionId) =>
    set((s) => ({
      flagged: s.flagged.includes(questionId)
        ? s.flagged.filter((id) => id !== questionId)
        : [...s.flagged, questionId],
    })),

  goToQuestion: (index) => set({ currentQuestion: index }),

  tick: () =>
    set((s) => ({
      timeRemaining: Math.max(0, s.timeRemaining - 1),
    })),

  submitExam: () => set({ isSubmitted: true }),

  resetExam: () =>
    set({
      examId: null,
      answers: {},
      flagged: [],
      timeRemaining: 0,
      isSubmitted: false,
      currentQuestion: 0,
    }),
}));
