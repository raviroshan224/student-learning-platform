import client from './client';
import type { EnrollmentModel } from '@/types/models/course';

export const EnrollmentsService = {
  myCourses: () => client.get<EnrollmentModel[]>('/enrollments/my-courses'),
  // Correct endpoint per API docs
  enrollFree: (courseId: string) =>
    client.post('/enrollments/free-course', { courseId }),
};
