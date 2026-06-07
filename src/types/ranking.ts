export interface RankedFund {
  rank: number;
  overall_rank: number;
  fund_id: string;
  fund_name: string;
  amc: string;
  category?: string;
  fund_type?: string;
  fund_age?: string | null;
  expense_ratio: number;
  aum_cr: number;
  one_year_return: number | null;
  one_year_rank: number | null;
  three_year_cagr: number | null;
  five_year_cagr: number | null;
  five_year_rank: number | null;
  ten_year_cagr: number | null;
  ten_year_rank: number | null;
  consistency_score: number | null;
  downside_protection_score: number | null;
  max_drawdown: number | null;
  sharpe_ratio: number | null;
  sortino_ratio: number | null;
  annualised_volatility: number | null;
  composite_score: number | null;
  ranking_eligible: boolean;
  data_sufficiency: 'FULL' | 'PARTIAL' | 'INSUFFICIENT';
}

export interface RankingsResponse {
  category: string;
  total: number;
  generated_at: string;
  funds: RankedFund[];
}
