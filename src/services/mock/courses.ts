import { MOCK_COURSES, MOCK_USER } from "./data";
import type { Course, CourseQueryParams } from "@/types/models/course";

export const mockCoursesService = {
  async getAll(params?: CourseQueryParams): Promise<Course[]> {
    await new Promise((r) => setTimeout(r, 300));
    let result = [...MOCK_COURSES];

    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (params?.category) {
      result = result.filter((c) => c.category === params.category);
    }

    return result;
  },

  async getById(id: string): Promise<Course | null> {
    await new Promise((r) => setTimeout(r, 250));
    const course = MOCK_COURSES.find((c) => c.id === id);
    if (!course) return null;
    // Mark as enrolled if user has it
    return {
      ...course,
      isEnrolled: MOCK_USER.enrolledCourses!.includes(id),
    };
  },

  async getEnrolled(): Promise<Course[]> {
    await new Promise((r) => setTimeout(r, 300));
    return MOCK_COURSES.filter((c) => MOCK_USER.enrolledCourses!.includes(c.id));
  },

  async getCategories(): Promise<string[]> {
    const cats = [...new Set(MOCK_COURSES.map((c) => c.category))];
    return cats;
  },

  async enroll(courseId: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 500));
    if (!MOCK_USER.enrolledCourses!.includes(courseId)) {
      MOCK_USER.enrolledCourses!.push(courseId);
      const course = MOCK_COURSES.find((c) => c.id === courseId);
      if (course) {
        course.isEnrolled = true;
        course.studentCount += 1;
      }
    }
  },
};
