import client from './client';
import type { CategoryHierarchyItem } from '@/types/models/category';

export const CategoriesService = {
  hierarchy: () => client.get<CategoryHierarchyItem[]>('/categories/hierarchy').then(res => res.data),
  favoriteSave: (categoryIds: string[]) =>
    client.put('/user-preferences/favorite-categories', { categoryIds }),
};
