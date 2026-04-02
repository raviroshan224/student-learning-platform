export type QuestionType = "mcq" | "true_false" | "short_answer";

export interface QuestionOption {
  id: string;
  text: string;
}

export interface ExamQuestion {
  id: string;
  text: string;
  type: QuestionType;
  options?: QuestionOption[];
  marks: number;
  // correctAnswer only visible after session ends
  correctAnswer?: string;
  explanation?: string;
}

export interface Exam {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  mockTestId?: string;
  duration: number; // minutes
  totalMarks: number;
  passingMarks: number;
  questionCount: number;
  questions: ExamQuestion[];
  startTime?: string;
  endTime?: string;
  status: "upcoming" | "active" | "completed";
}

export interface ExamAnswer {
  questionId: string;
  answer: string | string[];
}

export interface ExamResult {
  id: string;
  examId: string;
  examTitle: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  timeTaken: number; // seconds
  answers: Array<{
    questionId: string;
    given: string | string[];
    correct: string | string[];
    isCorrect: boolean;
    marks: number;
  }>;
  submittedAt: string;
}

// ─── Test Session (exam attempt) ────────────────────────────────────────────
export type SessionStatus = "in_progress" | "submitted" | "timed_out";
export type AnswerStatus = "answered" | "not_answered" | "marked_for_review";

export interface SessionQuestion {
  id: string;
  index: number;
  text: string;
  type: QuestionType;
  options?: QuestionOption[];
  marks: number;
  selectedAnswer?: string;
  status: AnswerStatus;
}

export interface TestSession {
  id: string;
  examId: string;
  userId: string;
  status: SessionStatus;
  currentQuestionIndex: number;
  totalQuestions: number;
  startedAt: string;
  expiresAt: string;
  submittedAt?: string;
}

export interface SessionSummary {
  total: number;
  answered: number;
  notAnswered: number;
  markedForReview: number;
  questions: Array<{
    index: number;
    questionId: string;
    status: AnswerStatus;
  }>;
}

export interface SessionResult {
  sessionId: string;
  examId: string;
  examTitle: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  timeTaken: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  submittedAt: string;
}

export interface SessionSolution {
  questionId: string;
  text: string;
  options?: QuestionOption[];
  correctAnswer: string;
  selectedAnswer?: string;
  isCorrect: boolean;
  marks: number;
  marksEarned: number;
  explanation?: string;
}

export interface SessionHistoryItem {
  sessionId: string;
  examId: string;
  examTitle: string;
  score: number;
  percentage: number;
  passed: boolean;
  timeTaken: number;
  submittedAt: string;
}

export interface ExamModel {
  id: string;
  title: string;
  categoryId?: string;
  categoryName?: string;
  examImageUrl?: string;
  validityDays?: number;
  courseCount?: number;
  status?: 'upcoming' | 'active' | 'completed';
  examDate?: string;
  daysRemaining?: number;
}

export interface MockTestModel {
  id: string;
  title: string;
  courseId: string;
  questionCount: number;
  totalMarks: number;
  timeLimitMinutes: number;
  attempted: boolean;
  lastAttemptScore?: number;
  lastAttemptDate?: string;
}

export interface TestSessionModel {
  id: string;
  mockTestId: string;
  startedAt: string;
  status: 'in_progress' | 'completed';
  questions?: QuestionModel[];
}

export interface QuestionModel {
  id: string;
  questionText: string;
  options: { id: string; text: string }[];
  correctOptionId?: string;
}

export interface TestAttemptResult {
  sessionId: string;
  score: number;
  totalMarks: number;
  percentage: number;
  timeTaken?: number;
  answers: { questionId: string; selectedOptionId: string; isCorrect: boolean }[];
}
