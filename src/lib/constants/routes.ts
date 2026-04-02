export const ROUTES = {
  HOME: "/",
  // Auth
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  VERIFY_EMAIL: "/verify-email",
  RESET_PASSWORD: "/reset-password",
  // Onboarding
  SELECT_CATEGORIES: "/select-categories",
  // Main
  DASHBOARD: "/dashboard",
  EXPLORE: "/explore",
  COURSES: "/courses",
  COURSE_DETAIL: (id: string) => `/courses/${id}`,
  COURSE_LEARN: (courseId: string, lectureId: string) =>
    `/courses/${courseId}/learn/${lectureId}`,
  COURSE_EXAM: (courseId: string, examId: string) =>
    `/courses/${courseId}/exam/${examId}`,
  COURSE_EXAM_RESULT: (courseId: string, examId: string) =>
    `/courses/${courseId}/exam/${examId}/result`,
  LIVE: "/live",
  LIVE_SESSION: (id: string) => `/live/${id}`,
  // Exam catalogue (public browsing)
  EXAMS: "/exams",
  EXAM_DETAIL: (examId: string) => `/exams/${examId}`,
  // Mock test engine
  TESTS: "/tests",
  TEST_DETAIL: (testId: string, courseId: string) => `/tests/${testId}?courseId=${courseId}`,
  TEST_QUIZ: (sessionId: string) => `/tests/session/${sessionId}/quiz`,
  TEST_RESULT: (sessionId: string) => `/tests/session/${sessionId}/result`,
  TEST_SOLUTIONS: (sessionId: string) => `/tests/session/${sessionId}/solutions`,
  NOTIFICATIONS: "/notifications",
  PROFILE: "/profile",
  CHECKOUT: (courseId: string) => `/checkout/${courseId}`,
};

export const PROTECTED_ROUTES = [
  "/dashboard",
  "/courses",
  "/exams",
  "/tests",
  "/live",
  "/profile",
  "/checkout",
  "/notifications",
];
