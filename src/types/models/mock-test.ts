export type MockTestStatus = "draft" | "published" | "archived";

export interface MockTestQuestion {
  id: string;
  text: string;
  options: Array<{ id: string; text: string }>;
  correctAnswer: string;
  explanation?: string;
  marks: number;
}

export interface MockTest {
  id: string;
  title: string;
  description?: string;
  courseId?: string;
  categoryId?: string;
  duration: number; // minutes
  totalMarks: number;
  passingMarks: number;
  questionCount: number;
  questions?: MockTestQuestion[];
  status: MockTestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMockTestPayload {
  title: string;
  description?: string;
  courseId?: string;
  categoryId?: string;
  duration: number;
  passingMarks: number;
  questions: Array<{
    text: string;
    options: Array<{ text: string }>;
    correctAnswer: string;
    explanation?: string;
    marks: number;
  }>;
}

export interface MockTestQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: MockTestStatus;
  courseId?: string;
  categoryId?: string;
}
