import apiClient from './client';

export async function runAllCalculations(): Promise<{ status: string; summary: Record<string, unknown> }> {
  const { data } = await apiClient.post('/calculations/run-all');
  return data;
}

export async function runFundCalculation(fundId: string): Promise<{ status: string; fund_id: string }> {
  const { data } = await apiClient.post(`/funds/${fundId}/calculate`);
  return data;
}
