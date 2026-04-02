import { MOCK_EXAMS, type MockExamResult } from "./data";

export const mockExamsService = {
  async getAll() {
    await new Promise((r) => setTimeout(r, 300));
    return MOCK_EXAMS.map((e) => ({ ...e }));
  },

  async getById(id: string) {
    await new Promise((r) => setTimeout(r, 250));
    const exam = MOCK_EXAMS.find((e) => e.id === id);
    return exam ? { ...exam } : null;
  },

  async submit(examId: string, answers: Record<string, string>) {
    await new Promise((r) => setTimeout(r, 800));
    const exam = MOCK_EXAMS.find((e) => e.id === examId);
    if (!exam) throw new Error("Exam not found");

    let score = 0;
    const answeredResults = exam.questions.map((q) => {
      const isCorrect = answers[q.id] === q.correctAnswer;
      if (isCorrect) score += q.marks;
      return {
        questionId: q.id,
        questionText: q.text,
        isCorrect,
        marks: isCorrect ? q.marks : 0,
        correctAnswer: q.correctAnswer,
        userAnswer: answers[q.id] ?? null,
      };
    });

    const percentage = Math.round((score / exam.totalMarks) * 100);
    const passed = score >= exam.passingMarks;
    const timeTaken = exam.duration * 60 - 120;

    const result: MockExamResult = {
      score,
      totalMarks: exam.totalMarks,
      percentage,
      passed,
      timeTaken,
    };

    // Update mock data
    exam.status = "completed";
    exam.result = result;

    return {
      examId,
      examTitle: exam.title,
      ...result,
      passingMarks: exam.passingMarks,
      answers: answeredResults,
    };
  },

  async getResult(examId: string) {
    await new Promise((r) => setTimeout(r, 250));
    const exam = MOCK_EXAMS.find((e) => e.id === examId);
    return exam?.result ?? null;
  },
};
