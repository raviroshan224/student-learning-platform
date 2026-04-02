import { useQuery } from "@tanstack/react-query";
import { CategoriesService } from "@/services/api/categories.service";

export function useCategoryHierarchy() {
  return useQuery({
    queryKey: ["categories-hierarchy"],
    queryFn: () => CategoriesService.hierarchy().then((r) => r.data),
    staleTime: 1000 * 60 * 10,
  });
}
