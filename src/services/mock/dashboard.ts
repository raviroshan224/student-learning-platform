import { MOCK_COURSES, MOCK_DASHBOARD_STATS, MOCK_USER } from "./data";

export const mockDashboardService = {
  async getStats() {
    await new Promise((r) => setTimeout(r, 300));
    return MOCK_DASHBOARD_STATS;
  },

  async getContinueLearning() {
    await new Promise((r) => setTimeout(r, 300));
    return MOCK_COURSES.filter((c) => MOCK_USER.enrolledCourses?.includes(c.id)).map(
      (c) => ({
        courseId: c.id,
        title: c.title,
        thumbnail: c.thumbnail,
        progress: c.progress ?? 0,
        lastLectureTitle: c.sections[0]?.lectures.find((l) => !l.isCompleted)?.title ?? c.sections[0]?.lectures[0]?.title ?? "",
        lastLectureId: c.sections[0]?.lectures.find((l) => !l.isCompleted)?.id ?? c.sections[0]?.lectures[0]?.id ?? "",
        category: c.category,
      })
    );
  },

  async getRecentResults() {
    await new Promise((r) => setTimeout(r, 300));
    return [
      {
        examId: "ex2",
        examTitle: "Cell Biology Assessment",
        courseName: "Biology (Grade 12)",
        score: 30,
        totalMarks: 40,
        percentage: 75,
        passed: true,
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  },
};
