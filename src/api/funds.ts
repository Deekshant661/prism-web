import apiClient from './client';
import type { Fund, FundDetail, HoldingsOverlapResponse } from '../types/fund';

export async function listFunds(): Promise<Fund[]> {
  const { data } = await apiClient.get<Fund[]>('/funds');
  return data;
}

export async function getFund(id: string): Promise<FundDetail> {
  const { data } = await apiClient.get<FundDetail>(`/funds/${id}`);
  return data;
}

export async function getHoldingsOverlap(fundIds: string[]): Promise<HoldingsOverlapResponse> {
  const { data } = await apiClient.post<HoldingsOverlapResponse>('/funds/holdings-overlap', {
    fund_ids: fundIds,
  });
  return data;
}
