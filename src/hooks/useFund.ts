import { useQuery } from '@tanstack/react-query';
import { getFund } from '../api/funds';

export function useFund(id: string | undefined) {
  return useQuery({
    queryKey: ['fund', id],
    queryFn: () => getFund(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}
