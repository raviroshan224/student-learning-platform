export interface QuestionOption {
  id: string;
  key?: string; // Mobile uses key (A, B, C, D)
  text: string;
  label?: string; // Mobile uses label
  isCorrect?: boolean;
}

export interface QuestionModel {
  id: string;
  questionText: string;
  prompt?: string; // Mobile uses prompt
  description?: string; // Sub-text / additional context
  imageUrl?: string; // Question image
  options: QuestionOption[];
  correctOptionId?: string;
  marks?: number;
  explanation?: string;
}

export interface TestSessionModel {
  id: string;
  mockTestId: string;
  status: "in_progress" | "inProgress" | "completed" | "timed_out" | "submitted" | "expired";
  currentQuestionIndex: number;
  totalQuestions: number;
  durationMinutes?: number;
  startedAt: string;
  expiresAt: string;
  endsAt?: string; // Mobile uses endsAt
  submittedAt?: string;
  questions?: QuestionModel[];
  title?: string;
  timeLimitMinutes?: number;
}

export interface QuestionResponseDto {
  question: QuestionModel;
  answer?: string;
  isMarkedForReview?: boolean;
}

export interface SessionSummary {
  total: number;
  answered: number;
  notAnswered: number;
  markedForReview: number;
  questions: Array<{
    index: number;
    questionId: string;
    status: "answered" | "not_answered" | "marked_for_review";
  }>;
}

export interface TestAttemptResult {
  sessionId: string;
  examId?: string;
  examTitle?: string;
  mockTestId?: string;
  mockTestTitle?: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  timeTaken?: number; // seconds
  timeSpentSeconds?: number; // Mobile field alias
  correctCount?: number;
  correct?: number; // Mobile alias
  incorrectCount?: number;
  incorrect?: number; // Mobile alias
  skippedCount?: number;
  skipped?: number; // Mobile alias
  attempted?: number;
  submittedAt?: string;
  completedAt?: string; // Mobile uses completedAt
  rank?: number;
  percentile?: number;
  feedback?: string;
  answers?: Array<{
    questionId: string;
    selectedOptionId: string;
    isCorrect: boolean;
    marks: number;
  }>;
}

/** Matches mobile TestHistoryItem */
export interface TestHistoryItem {
  sessionId: string;
  mockTestId?: string;
  mockTestTitle?: string;
  examTitle?: string;
  courseId?: string;
  score?: number;
  percentage?: number;
  correct?: number;
  incorrect?: number;
  attempted?: number;
  totalQuestions?: number;
  completedAt?: string;
  submittedAt?: string;
  durationMinutes?: number;
  passed?: boolean;
  attemptNumber?: number;
  status?: string;
}

export interface SessionSolution {
  questionId: string;
  text?: string;
  question?: QuestionModel;
  options: QuestionOption[] | Record<string, string>;
  correctAnswer?: string;
  correctOptionKey?: string; // Mobile alias
  selectedAnswer?: string;
  selectedAnswerKey?: string; // Mobile alias
  isCorrect?: boolean;
  marks?: number;
  marksEarned?: number;
  explanation?: string;
  media?: string[];
}

export interface ExamModel {
  id: string;
  title: string;
  categoryId?: string;
  categoryName?: string;
  examImageUrl?: string;
  validityDays?: number;
  status?: "upcoming" | "active" | "completed";
  examDate?: string;
  daysRemaining?: number;
}

export interface SubjectDistribution {
  subjectId?: string;
  subjectName: string;
  questionCount: number;
}

export interface MockTestModel {
  id: string;
  title: string;
  courseId: string;
  // Question count — API may return either field name
  questionCount?: number;
  numberOfQuestions?: number;
  // Duration — API may return either field name
  timeLimitMinutes?: number;
  durationMinutes?: number;
  totalMarks?: number;
  passingPercentage?: number;
  // Attempt tracking
  attemptsAllowed?: number;
  attemptsUsed?: number;
  remainingAttempts?: number;
  totalAttempts?: number;
  averageScore?: number;
  maxAttemptsReached?: boolean;
  // Access control
  isFree: boolean;
  isPurchased: boolean;
  canTakeTest: boolean;
  cost?: number;
  // Metadata
  description?: string;
  instructions?: string[];
  testType?: string;
  subjectId?: string;
  subjectName?: string;
  subjectDistribution?: SubjectDistribution[];
  // Legacy fields for backwards compat
  attempted?: boolean;
  lastAttemptScore?: number;
  lastAttemptDate?: string;
}
