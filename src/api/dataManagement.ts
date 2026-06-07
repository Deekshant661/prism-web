import apiClient from './client';

// Match schemes
export interface MatchResult {
  fund_id: string;
  fund_name: string;
  scheme_code: string | null;
  scheme_name: string | null;
  confidence: number;
  matched: boolean;
}

export interface MatchResponse {
  matched: number;
  unmatched: number;
  results: MatchResult[];
}

export async function matchSchemes(): Promise<MatchResponse> {
  const { data } = await apiClient.post<MatchResponse>('/nav/match-schemes');
  return data;
}

// Import NAV
export interface ImportResult {
  fund_id: string;
  fund_name: string;
  records_fetched: number;
  records_inserted: number;
  records_skipped: number;
}

export interface ImportAllResult {
  funds_processed: number;
  total_inserted: number;
  total_skipped: number;
  errors: string[];
  fund_results?: ImportResult[];
}

export async function importFundNav(fundId: string): Promise<ImportResult> {
  const { data } = await apiClient.post<ImportResult>(`/nav/import/${fundId}`);
  return data;
}

export async function importAllNavs(): Promise<ImportAllResult> {
  const { data } = await apiClient.post<ImportAllResult>('/nav/import-all');
  return data;
}

export async function syncFundNav(fundId: string): Promise<ImportResult> {
  const { data } = await apiClient.post<ImportResult>(`/nav/sync/${fundId}`);
  return data;
}

// Status
export interface FundDataStatus {
  fund_id: string;
  fund_name: string;
  category: string;
  scheme_code: string | null;
  scheme_matched: boolean;
  nav_record_count: number;
  earliest_nav_date: string | null;
  latest_nav_date: string | null;
  metrics_last_updated: string | null;
  ranking_eligible: boolean;
  ineligibility_reason: string | null;
}

export async function getNavStatus(): Promise<FundDataStatus[]> {
  const { data } = await apiClient.get<FundDataStatus[]>('/nav/status');
  return data;
}

// Calculations
export async function runAllCalculations(): Promise<{ status: string; summary: unknown }> {
  const { data } = await apiClient.post('/calculations/run-all');
  return data;
}

// Scheme Discovery
export interface DiscoverFundResult {
  fund_name: string;
  discovered: number;
  already_existed: number;
  total_schemes: number;
}

export interface DiscoverAllResult {
  funds_processed: number;
  total_discovered: number;
  total_already_existed: number;
  errors: string[];
  fund_results: DiscoverFundResult[];
}

export async function discoverAllSchemes(): Promise<DiscoverAllResult> {
  const { data } = await apiClient.post<DiscoverAllResult>('/schemes/discover-all');
  return data;
}

export async function discoverFundSchemes(fundId: string): Promise<unknown> {
  const { data } = await apiClient.post(`/schemes/discover/${fundId}`);
  return data;
}

export async function importSchemeNav(schemeId: string): Promise<unknown> {
  const { data } = await apiClient.post(`/nav/import-scheme/${schemeId}`);
  return data;
}
