import { useState, useMemo } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { useCompare } from '../hooks/useCompare';
import { listFunds, getHoldingsOverlap } from '../api/funds';
import { getFundNav } from '../api/nav';
import type { Fund, FundDetail } from '../types/fund';
import {
  formatReturn,
  formatCurrency,
  formatExpenseRatio,
  formatScore,
  categoryLabel,
} from '../utils/format';
import PageWrapper from '../components/layout/PageWrapper';
import CompareLineChart from '../components/charts/CompareLineChart';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';

type DateRange = '1Y' | '3Y' | '5Y' | 'MAX';

const CATEGORY_TO_FUND_TYPE: Record<string, string> = {
  LARGE_CAP: 'Equity', MID_CAP: 'Equity', SMALL_CAP: 'Equity', FLEXI_CAP: 'Equity',
  ELSS: 'Tax Saving (ELSS)', INDEX: 'Index', DEBT: 'Debt', BALANCED_ADVANTAGE: 'Hybrid',
};

function getDateFrom(range: DateRange): string | undefined {
  if (range === 'MAX') return undefined;
  const now = new Date();
  const years = range === '1Y' ? 1 : range === '3Y' ? 3 : 5;
  now.setFullYear(now.getFullYear() - years);
  return now.toISOString().split('T')[0];
}

// Metric row definitions
interface MetricRow {
  label: string;
  getter: (f: FundDetail) => number | string | null | undefined;
  format: (v: unknown) => string;
  lowerIsBetter?: boolean;
  isString?: boolean;
}

const metricsRows: MetricRow[] = [
  // Fund info
  { label: 'Category', getter: (f) => categoryLabel(f.category), format: (v) => String(v ?? '—'), isString: true },
  { label: 'Fund Type', getter: (f) => CATEGORY_TO_FUND_TYPE[f.category] || f.category, format: (v) => String(v ?? '—'), isString: true },
  { label: 'Fund Age', getter: (f) => f.metrics?.fund_age_years, format: (v) => v != null ? `${Number(v).toFixed(1)} yrs` : '—' },
  { label: 'Expense Ratio', getter: (f) => f.expense_ratio, format: (v) => formatExpenseRatio(v as number | null), lowerIsBetter: true },
  { label: 'AUM', getter: (f) => f.aum_cr, format: (v) => formatCurrency(v as number | null) },
  // Returns
  { label: '1Y Return', getter: (f) => f.metrics?.one_year_return, format: (v) => formatReturn(v as number | null) },
  { label: '3Y CAGR', getter: (f) => f.metrics?.three_year_cagr, format: (v) => formatReturn(v as number | null) },
  { label: '5Y CAGR', getter: (f) => f.metrics?.five_year_cagr, format: (v) => formatReturn(v as number | null) },
  { label: '10Y CAGR', getter: (f) => f.metrics?.ten_year_cagr, format: (v) => v != null ? formatReturn(v as number | null) : '—' },
  // Rankings
  { label: 'Composite Score', getter: (f) => f.metrics?.composite_score, format: (v) => formatScore(v as number | null) },
  { label: 'Overall Rank', getter: (f) => f.metrics?.rank_within_category, format: (v) => v != null ? `#${v}` : '—', lowerIsBetter: true },
  { label: '1Y Rank', getter: (f) => f.metrics?.one_year_rank, format: (v) => v != null ? `#${v}` : '—', lowerIsBetter: true },
  { label: '5Y Rank', getter: (f) => f.metrics?.five_year_rank, format: (v) => v != null ? `#${v}` : '—', lowerIsBetter: true },
  // Risk
  { label: 'Sharpe Ratio', getter: (f) => f.metrics?.sharpe_ratio, format: (v) => v != null ? Number(v).toFixed(2) : '—' },
  { label: 'Sortino Ratio', getter: (f) => f.metrics?.sortino_ratio, format: (v) => v != null ? Number(v).toFixed(2) : '—' },
  { label: 'Max Drawdown', getter: (f) => f.metrics?.max_drawdown, format: (v) => v != null ? `${Number(v).toFixed(1)}%` : '—', lowerIsBetter: false },
  { label: 'Volatility', getter: (f) => f.metrics?.annualised_volatility, format: (v) => v != null ? `${Number(v).toFixed(1)}%` : '—', lowerIsBetter: true },
  { label: 'Consistency', getter: (f) => f.metrics?.consistency_score, format: (v) => v != null ? `${Number(v).toFixed(1)}` : '—' },
];

function getBestWorstIdx(values: (number | null | undefined)[], higherIsBetter: boolean) {
  let bestIdx = -1;
  let worstIdx = -1;
  let bestVal = higherIsBetter ? -Infinity : Infinity;
  let worstVal = higherIsBetter ? Infinity : -Infinity;
  const validCount = values.filter((v) => v != null).length;
  if (validCount < 2) return { bestIdx: -1, worstIdx: -1 };

  values.forEach((v, i) => {
    if (v != null) {
      if (higherIsBetter) {
        if (v > bestVal) { bestVal = v; bestIdx = i; }
        if (v < worstVal) { worstVal = v; worstIdx = i; }
      } else {
        if (v < bestVal) { bestVal = v; bestIdx = i; }
        if (v > worstVal) { worstVal = v; worstIdx = i; }
      }
    }
  });
  return { bestIdx, worstIdx: bestIdx !== worstIdx ? worstIdx : -1 };
}

export default function ComparePage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>('3Y');

  const { data: allFunds } = useQuery({
    queryKey: ['funds'],
    queryFn: listFunds,
    staleTime: 5 * 60 * 1000,
  });

  const { funds: compareFunds, isLoading } = useCompare(selectedIds);

  const fromDate = useMemo(() => getDateFrom(dateRange), [dateRange]);

  const navResults = useQueries({
    queries: selectedIds.map((id) => ({
      queryKey: ['fundNav', id, fromDate],
      queryFn: () => getFundNav(id, fromDate),
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
      select: (data: { nav_date: string; nav_value: number }[]) =>
        [...data].sort((a, b) => new Date(a.nav_date).getTime() - new Date(b.nav_date).getTime()),
    })),
  });

  // Holdings overlap query
  const { data: overlapData, isLoading: overlapLoading } = useQuery({
    queryKey: ['holdingsOverlap', ...selectedIds],
    queryFn: () => getHoldingsOverlap(selectedIds),
    enabled: selectedIds.length >= 2,
    staleTime: 5 * 60 * 1000,
  });

  const chartFundsData = useMemo(() => {
    return compareFunds
      .map((fund, idx) => ({
        fundName: fund.name,
        data: navResults[idx]?.data || [],
      }))
      .filter((f) => f.data.length > 0);
  }, [compareFunds, navResults]);

  const filteredFunds = useMemo(() => {
    if (!allFunds || !searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allFunds
      .filter(
        (f) =>
          !selectedIds.includes(f.id) &&
          (f.name.toLowerCase().includes(q) || f.amc?.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [allFunds, searchQuery, selectedIds]);

  const addFund = (fund: Fund) => {
    if (selectedIds.length < 4 && !selectedIds.includes(fund.id)) {
      setSelectedIds([...selectedIds, fund.id]);
    }
    setSearchQuery('');
    setShowDropdown(false);
  };

  const removeFund = (id: string) => {
    setSelectedIds(selectedIds.filter((fid) => fid !== id));
  };

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Compare Funds</h1>
      <p className="text-sm text-gray-500 mb-6">Select up to 4 funds for side-by-side comparison</p>

      {/* Fund Selector */}
      <div className="relative mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {selectedIds.map((id) => {
            const fund = compareFunds.find((f) => f.id === id) || allFunds?.find((f) => f.id === id);
            return (
              <span key={id} className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium px-3 py-1.5 rounded-full">
                {fund?.name || 'Loading...'}
                <button onClick={() => removeFund(id)} className="hover:text-indigo-900 transition-colors">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            );
          })}
        </div>

        {selectedIds.length < 4 && (
          <div className="relative">
            <input
              type="text"
              placeholder="Search and add a fund..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full max-w-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
            {showDropdown && filteredFunds.length > 0 && (
              <div className="absolute z-10 mt-1 w-full max-w-md bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredFunds.map((fund) => (
                  <button
                    key={fund.id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => addFund(fund)}
                    className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Badge category={fund.category} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{fund.name}</p>
                      <p className="text-xs text-gray-500">{fund.amc} · {categoryLabel(fund.category)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {selectedIds.length < 2 ? (
        <EmptyState heading="Select at least 2 funds" subtext="Use the search box above to add funds for comparison" />
      ) : isLoading ? (
        <Spinner size="lg" />
      ) : (
        <>
          {/* Metrics Comparison Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="text-left py-3 px-4 font-medium text-gray-500 min-w-[140px] sticky left-0 bg-gray-50/50 z-10">Metric</th>
                    {compareFunds.map((fund) => (
                      <th key={fund.id} className="text-right py-3 px-4 font-medium text-gray-900 min-w-[150px]">
                        <div className="truncate max-w-[170px] ml-auto">{fund.name}</div>
                        <div className="mt-0.5"><Badge category={fund.category} /></div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metricsRows.map((row) => {
                    const values = compareFunds.map((f) => row.getter(f));
                    const numValues = values.map((v) => (typeof v === 'number' ? v : null));
                    const higherIsBetter = row.lowerIsBetter !== undefined ? !row.lowerIsBetter : true;
                    const { bestIdx, worstIdx } = row.isString
                      ? { bestIdx: -1, worstIdx: -1 }
                      : getBestWorstIdx(numValues, higherIsBetter);

                    return (
                      <tr key={row.label} className="border-b border-gray-100">
                        <td className="py-3 px-4 font-medium text-gray-600 sticky left-0 bg-white z-10 border-r border-gray-50">{row.label}</td>
                        {values.map((val, idx) => {
                          let cellClass = 'text-gray-900';
                          if (idx === bestIdx) cellClass = 'bg-green-50 text-green-700';
                          else if (idx === worstIdx) cellClass = 'bg-red-50 text-red-600';

                          return (
                            <td key={idx} className={`py-3 px-4 text-right font-medium ${cellClass}`}>
                              {row.format(val)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* NAV Growth Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">NAV Growth Comparison</h2>
                <p className="text-xs text-gray-500 mt-0.5">Values normalized to base 100 for fair comparison</p>
              </div>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                {(['1Y', '3Y', '5Y', 'MAX'] as DateRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      dateRange === range ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            {chartFundsData.length > 0 ? (
              <CompareLineChart fundsData={chartFundsData} />
            ) : (
              <EmptyState heading="No NAV data available" subtext="NAV data is needed for chart comparison" />
            )}
          </div>

          {/* Holdings Overlap Panel */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Holdings Overlap</h2>
            {overlapLoading ? (
              <Spinner />
            ) : overlapData ? (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-indigo-700">{overlapData.overlap_pct.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500">portfolio overlap across selected funds</p>
                  </div>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(overlapData.overlap_pct, 100)}%` }}
                    />
                  </div>
                </div>

                {overlapData.common_holdings.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Common Holdings</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 font-medium text-gray-500">Company</th>
                            {compareFunds.map((f) => (
                              <th key={f.id} className="text-right py-2 font-medium text-gray-500 min-w-[80px]">
                                {f.name.split(' ').slice(0, 2).join(' ')}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {overlapData.common_holdings.slice(0, 15).map((h) => (
                            <tr key={h.company_name} className="border-b border-gray-50">
                              <td className="py-2 text-gray-900 font-medium">{h.company_name}</td>
                              {compareFunds.map((f) => {
                                const entry = h.funds.find((e) => e.fund_id === f.id);
                                return (
                                  <td key={f.id} className="py-2 text-right text-gray-600">
                                    {entry ? `${entry.allocation_pct.toFixed(1)}%` : '—'}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Unique holdings per fund */}
                {Object.entries(overlapData.unique_to_each).some(([, v]) => v.length > 0) && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Unique Holdings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {compareFunds.map((fund) => {
                        const unique = overlapData.unique_to_each[fund.id] || [];
                        if (unique.length === 0) return null;
                        return (
                          <div key={fund.id} className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs font-semibold text-gray-700 mb-2 truncate">{fund.name}</p>
                            <div className="flex flex-wrap gap-1">
                              {unique.slice(0, 8).map((company) => (
                                <span key={company} className="text-xs bg-white text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                                  {company}
                                </span>
                              ))}
                              {unique.length > 8 && (
                                <span className="text-xs text-gray-400">+{unique.length - 8} more</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <EmptyState heading="No holdings data" subtext="Upload factsheets to see overlap analysis" />
            )}
          </div>
        </>
      )}
    </PageWrapper>
  );
}
