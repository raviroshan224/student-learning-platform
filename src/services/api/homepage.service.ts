import client from './client';
import type { HomepageData } from '@/types/models/homepage';
import type { CourseModel } from '@/types/models/course';

export const HomepageService = {
  get: () => client.get<HomepageData>('/homepage'),
  search: (q: string) => client.get<CourseModel[]>('/homepage/search', { params: { q } }),
  updateLatestCategory: (categoryId: string) =>
    client.put('/homepage/latest-category', { categoryId }),
};
