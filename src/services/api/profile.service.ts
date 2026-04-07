import client from './client';
import type { FavoriteCategory } from '@/types/models/category';
import type { CourseModel } from '@/types/models/course';

export const ProfileService = {
  // --- Preferred Categories (Favorites) ---
  getPreferredCategories: () =>
    client.get<{ favoriteCategories: FavoriteCategory[] }>('/user-preferences/favorite-categories')
      .then(res => res.data.favoriteCategories),

  updatePreferredCategories: (categoryIds: string[]) =>
    client.put<{ favoriteCategories: FavoriteCategory[] }>('/user-preferences/favorite-categories', { categoryIds })
      .then(res => res.data.favoriteCategories),

  // --- Saved Courses ---
  getSavedCourses: (params?: { page?: number; limit?: number }) =>
    client.get<{ data: CourseModel[]; meta: any }>('/courses/saved/my-courses', { params })
      .then(res => res.data),

  deleteSavedCourse: (courseId: string) =>
    client.delete<{ isSaved: boolean }>(`/courses/${courseId}/save`)
      .then(res => res.data),
};
