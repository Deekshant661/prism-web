import { useQueries } from '@tanstack/react-query';
import { getFund } from '../api/funds';
import type { FundDetail } from '../types/fund';

export function useCompare(fundIds: string[]) {
  const results = useQueries({
    queries: fundIds.map((id) => ({
      queryKey: ['fund', id],
      queryFn: () => getFund(id),
      staleTime: 5 * 60 * 1000,
      enabled: !!id,
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const errors = results
    .filter((r) => r.error)
    .map((r) => r.error);
  const funds: FundDetail[] = results
    .filter((r) => r.data)
    .map((r) => r.data as FundDetail);

  return { funds, isLoading, errors };
}
