import { useQuery } from '@tanstack/react-query';
import { HomepageService } from '@/services/api/homepage.service';

export function useHomepage() {
  return useQuery({
    queryKey: ['homepage'],
    queryFn: () => HomepageService.get().then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  });
}
