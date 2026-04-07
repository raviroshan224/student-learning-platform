import client from './client';
import type { CourseModel, SubjectModel, LectureModel, LecturerModel, CourseMaterialModel, MockTestModel, CourseDetailsResponse } from '@/types/models/course';

export const CoursesService = {
  list: (params?: { page?: number; limit?: number; search?: string; categoryId?: string }) =>
    client.get<{ data: CourseModel[]; meta: any }>('/courses', { params }),

  detail: (id: string) =>
    client.get<CourseDetailsResponse>(`/courses/${id}/details`),

  categories: () =>
    client.get<any[]>('/categories'),

  save: (id: string) => client.post<{ isSaved: boolean }>(`/courses/${id}/save`),
  unsave: (id: string) => client.delete<{ isSaved: boolean }>(`/courses/${id}/save`),
  savedMyCourses: (params?: { page?: number; limit?: number; search?: string }) => 
    client.get<{ data: CourseModel[]; meta: any }>('/courses/saved/my-courses', { params }).then(res => res.data),

  subjects: (courseId: string) =>
    client.get<SubjectModel[]>(`/subjects/course/${courseId}`),

  lecturesBySubject: (subjectId: string) =>
    client.get<LectureModel[]>(`/lectures/subject/${subjectId}`),

  watchLecture: (lectureId: string) =>
    client.post<{ url: string }>(`/lectures/${lectureId}/watch`),

  completeLecture: (lectureId: string) =>
    client.post(`/lectures/${lectureId}/complete`),

  lecturers: (courseId: string) =>
    client.get<LecturerModel[]>(`/lecturers/course/${courseId}`),

  materials: (courseId: string) =>
    client.get<CourseMaterialModel[]>(`/course-materials/course/${courseId}`),

  downloadMaterial: (id: string) =>
    client.post<{ url: string }>(`/course-materials/${id}/download`),

  mockTests: (courseId: string) =>
    client.get<MockTestModel[]>(`/mock-tests/courses/${courseId}/with-attempts`),
};
