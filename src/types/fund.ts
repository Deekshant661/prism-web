export type FundCategory =
  | 'LARGE_CAP'
  | 'MID_CAP'
  | 'SMALL_CAP'
  | 'FLEXI_CAP'
  | 'ELSS'
  | 'INDEX'
  | 'DEBT'
  | 'BALANCED_ADVANTAGE';

export interface Fund {
  id: string;
  name: string;
  category: FundCategory;
  amc: string;
  fund_manager: string;
  expense_ratio: number;
  aum_cr: number;
  inception_date: string;
  benchmark_index: string;
}

export interface FundMetrics {
  one_month_return: number | null;
  three_month_return: number | null;
  six_month_return: number | null;
  one_year_return: number | null;
  three_year_cagr: number | null;
  five_year_cagr: number | null;
  ten_year_cagr: number | null;
  consistency_score: number | null;
  downside_protection_score: number | null;
  max_drawdown: number | null;
  sharpe_ratio: number | null;
  sortino_ratio: number | null;
  annualised_volatility: number | null;
  rolling_1y_min: number | null;
  rolling_1y_max: number | null;
  rolling_1y_mean: number | null;
  rolling_1y_std: number | null;
  composite_score: number | null;
  rank_within_category: number | null;
  one_year_rank: number | null;
  five_year_rank: number | null;
  ten_year_rank: number | null;
  fund_age_days: number | null;
  fund_age_years: number | null;
  ranking_eligible: boolean | null;
  ineligibility_reason: string | null;
  data_sufficiency: 'FULL' | 'PARTIAL' | 'INSUFFICIENT';
}

export interface Holding {
  company_name: string;
  allocation_pct: number;
}

export interface SectorAllocation {
  sector_name: string;
  allocation_pct: number;
}

export interface Scheme {
  scheme_id: string;
  scheme_code: string;
  plan_type: 'DIRECT' | 'REGULAR';
  option_type: 'GROWTH' | 'IDCW';
  expense_ratio: number | null;
  is_primary: boolean;
}

export interface FundDetail extends Fund {
  metrics: FundMetrics | null;
  holdings: Holding[];
  sector_allocations: SectorAllocation[];
  schemes: Scheme[];
}

// Holdings overlap types
export interface FundHoldingEntry {
  fund_id: string;
  fund_name: string;
  allocation_pct: number;
}

export interface CommonHolding {
  company_name: string;
  funds: FundHoldingEntry[];
}

export interface HoldingsOverlapResponse {
  overlap_pct: number;
  common_holdings: CommonHolding[];
  unique_to_each: Record<string, string[]>;
}
