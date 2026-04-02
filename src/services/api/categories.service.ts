import client from './client';
import type { CategoryModel } from '@/types/models/category';

export const CategoriesService = {
  hierarchy: () => client.get<CategoryModel[]>('/categories/hierarchy'),
  favoriteSave: (categoryIds: string[]) =>
    client.post('/user-preferences/favorite-categories', { categoryIds }),
};
