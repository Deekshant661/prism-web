import { useQuery } from '@tanstack/react-query';
import { getFundNav } from '../api/nav';

export function useFundNav(id: string | undefined, from?: string, to?: string) {
  return useQuery({
    queryKey: ['fundNav', id, from, to],
    queryFn: () => getFundNav(id!, from, to),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    select: (data) =>
      [...data].sort(
        (a, b) => new Date(a.nav_date).getTime() - new Date(b.nav_date).getTime()
      ),
  });
}
