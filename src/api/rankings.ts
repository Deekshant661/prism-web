import apiClient from './client';
import type { FundCategory } from '../types/fund';
import type { RankingsResponse } from '../types/ranking';

export interface RankingsParams {
  category?: FundCategory;
  sort_by?: string;
  order?: string;
  limit?: number;
  offset?: number;
}

export async function getRankings(params?: RankingsParams): Promise<RankingsResponse> {
  const { data } = await apiClient.get<RankingsResponse>('/rankings', { params });
  return data;
}

export async function getCategoryRankings(category: FundCategory): Promise<RankingsResponse> {
  const { data } = await apiClient.get<RankingsResponse>(`/rankings/${category}`);
  return data;
}
