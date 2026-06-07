import { useQuery } from '@tanstack/react-query';
import { getRankings, type RankingsParams } from '../api/rankings';

export function useRankings(params?: RankingsParams) {
  return useQuery({
    queryKey: ['rankings', params],
    queryFn: () => getRankings(params),
    staleTime: 5 * 60 * 1000,
  });
}
