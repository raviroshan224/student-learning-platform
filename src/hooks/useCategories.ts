import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CategoriesService } from '@/services/api/categories.service';

export function useCategoryHierarchy() {
  return useQuery({
    queryKey: ['categories-hierarchy'],
    queryFn: () => CategoriesService.hierarchy().then((r) => r.data),
    staleTime: 1000 * 60 * 10,
  });
}

export function useSaveFavoriteCategories() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (categoryIds: string[]) => CategoriesService.favoriteSave(categoryIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-me'] });
    },
  });
}
