export interface ApiError {
  detail: string;
  status: number;
}

export interface UploadResult {
  inserted: number;
  updated: number;
  skipped: number;
  warnings: string[];
}

export interface ExtractionQuality {
  fund_name_found: boolean;
  amc_found: boolean;
  expense_ratio_found: boolean;
  aum_found: boolean;
  holdings_count: number;
  sectors_count: number;
  overall: 'GOOD' | 'PARTIAL' | 'POOR';
}

export interface FactsheetExtraction {
  extracted: {
    fund_name: string | null;
    amc: string | null;
    fund_manager: string | null;
    expense_ratio: number | null;
    aum_cr: number | null;
    inception_date: string | null;
    benchmark_index: string | null;
    top_holdings: { company_name: string; allocation_pct: number }[];
    sector_allocations: { sector_name: string; allocation_pct: number }[];
  };
  matched_fund_id: string | null;
  match_confidence: number;
  extraction_quality: ExtractionQuality | null;
  raw_text_preview: string;
}

export interface FactsheetConfirmPayload {
  fund_id: string;
  extracted_data: FactsheetExtraction['extracted'];
  factsheet_date: string;
}
