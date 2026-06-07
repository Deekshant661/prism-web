import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useFund } from '../hooks/useFund';
import { useFundNav } from '../hooks/useFundNav';
import { getSchemeNav } from '../api/nav';
import type { Scheme } from '../types/fund';
import type { NavPoint } from '../types/nav';
import {
  formatReturn,
  formatCurrency,
  formatExpenseRatio,
  formatDate,
  formatScore,
  categoryLabel,
} from '../utils/format';
import PageWrapper from '../components/layout/PageWrapper';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import NavLineChart from '../components/charts/NavLineChart';
import SectorPieChart from '../components/charts/SectorPieChart';
import HoldingsTable from '../components/tables/HoldingsTable';
import SIPCalculator from '../components/calculators/SIPCalculator';

const CATEGORY_TO_FUND_TYPE: Record<string, string> = {
  LARGE_CAP: 'Equity', MID_CAP: 'Equity', SMALL_CAP: 'Equity', FLEXI_CAP: 'Equity',
  ELSS: 'Tax Saving (ELSS)', INDEX: 'Index', DEBT: 'Debt', BALANCED_ADVANTAGE: 'Hybrid',
};

const FUND_TYPE_COLORS: Record<string, string> = {
  Equity: 'bg-blue-100 text-blue-700', Hybrid: 'bg-teal-100 text-teal-700',
  Index: 'bg-gray-100 text-gray-700', 'Tax Saving (ELSS)': 'bg-green-100 text-green-700',
  Debt: 'bg-yellow-100 text-yellow-700',
};

type DateRange = '1M' | '6M' | '1Y' | '3Y' | '5Y' | 'MAX';

function getDateFrom(range: DateRange): string | undefined {
  if (range === 'MAX') return undefined;
  const now = new Date();
  if (range === '1M') { now.setMonth(now.getMonth() - 1); }
  else if (range === '6M') { now.setMonth(now.getMonth() - 6); }
  else {
    const years = range === '1Y' ? 1 : range === '3Y' ? 3 : 5;
    now.setFullYear(now.getFullYear() - years);
  }
  return now.toISOString().split('T')[0];
}

// Watchlist helpers
function getWatchlist(): string[] {
  try {
    return JSON.parse(localStorage.getItem('mf_watchlist') || '[]');
  } catch {
    return [];
  }
}

function toggleWatchlist(id: string): boolean {
  const list = getWatchlist();
  const idx = list.indexOf(id);
  if (idx >= 0) {
    list.splice(idx, 1);
    localStorage.setItem('mf_watchlist', JSON.stringify(list));
    return false;
  } else {
    list.push(id);
    localStorage.setItem('mf_watchlist', JSON.stringify(list));
    return true;
  }
}

export default function FundDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: fund, isLoading, error } = useFund(id!);
  const [dateRange, setDateRange] = useState<DateRange>('3Y');
  const [showCategoryAvg, setShowCategoryAvg] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(() =>
    id ? getWatchlist().includes(id) : false
  );

  const fromDate = useMemo(() => getDateFrom(dateRange), [dateRange]);
  const { data: navData } = useFundNav(id!, fromDate);

  const m = fund?.metrics ?? null;

  // --- Scheme Plan/Option Switcher (hooks MUST be above early returns) ---
  const schemes: Scheme[] = fund?.schemes ?? [];
  const primaryScheme = schemes.find((s) => s.is_primary) ?? null;

  const availablePlans = useMemo(() => {
    const plans = new Set(schemes.map((s) => s.plan_type));
    return ['DIRECT', 'REGULAR'].filter((p) => plans.has(p));
  }, [schemes]);

  const [selectedPlan, setSelectedPlan] = useState<string>('DIRECT');
  const [selectedOption, setSelectedOption] = useState<string>('GROWTH');
  const [schemeNavData, setSchemeNavData] = useState<NavPoint[] | null>(null);
  const [schemeNavLoading, setSchemeNavLoading] = useState(false);

  const activeScheme = useMemo(() => {
    return schemes.find(
      (s) => s.plan_type === selectedPlan && s.option_type === selectedOption
    ) ?? primaryScheme;
  }, [schemes, selectedPlan, selectedOption, primaryScheme]);

  const availableOptions = useMemo(() => {
    const opts = new Set(
      schemes.filter((s) => s.plan_type === selectedPlan).map((s) => s.option_type)
    );
    return ['GROWTH', 'IDCW'].filter((o) => opts.has(o));
  }, [schemes, selectedPlan]);

  const isPrimarySelected = activeScheme?.is_primary ?? true;

  const fetchSchemeNav = useCallback(async () => {
    if (isPrimarySelected || !activeScheme) {
      setSchemeNavData(null);
      return;
    }
    setSchemeNavLoading(true);
    try {
      const data = await getSchemeNav(activeScheme.scheme_id, fromDate);
      const sorted = [...data].sort(
        (a, b) => new Date(a.nav_date).getTime() - new Date(b.nav_date).getTime()
      );
      setSchemeNavData(sorted);
    } catch (err) {
      console.error('Failed to fetch scheme NAV:', err);
      setSchemeNavData(null);
    } finally {
      setSchemeNavLoading(false);
    }
  }, [isPrimarySelected, activeScheme, fromDate]);

  useEffect(() => {
    fetchSchemeNav();
  }, [fetchSchemeNav]);

  const displayNavData = isPrimarySelected ? navData : schemeNavData;
  const displayExpenseRatio = activeScheme?.expense_ratio ?? fund?.expense_ratio ?? null;
  const hasMultipleSchemes = schemes.length > 1;

  // --- Early returns (AFTER all hooks) ---
  if (isLoading) return <Spinner size="lg" />;
  if (error) return <ErrorState message="Failed to load fund details" />;
  if (!fund) return <ErrorState message="Fund not found" />;

  return (
    <PageWrapper>
      {/* Ineligibility Warning Banner */}
      {m && m.ranking_eligible === false && m.ineligibility_reason && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-amber-800">This fund is not included in rankings</p>
            <p className="text-sm text-amber-700">{m.ineligibility_reason}</p>
          </div>
        </div>
      )}
      {/* Section 1 — Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 truncate">{fund.name}</h1>
              <button
                onClick={() => setIsBookmarked(toggleWatchlist(fund.id))}
                className="shrink-0 text-gray-400 hover:text-indigo-600 transition-colors"
                title={isBookmarked ? 'Remove from watchlist' : 'Add to watchlist'}
              >
                {isBookmarked ? (
                  <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 3a2 2 0 00-2 2v16l9-4 9 4V5a2 2 0 00-2-2H5z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                  </svg>
                )}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
              {fund.amc && <span>{fund.amc}</span>}
              {fund.amc && <span className="text-gray-300">·</span>}
              <Badge category={fund.category} />
              {(() => {
                const fundType = CATEGORY_TO_FUND_TYPE[fund.category];
                if (!fundType) return null;
                const typeColor = FUND_TYPE_COLORS[fundType] || 'bg-gray-100 text-gray-700';
                return (
                  <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${typeColor}`}>
                    {fundType}
                  </span>
                );
              })()}
              {fund.aum_cr != null && (
                <>
                  <span className="text-gray-300">·</span>
                  <span>{formatCurrency(fund.aum_cr)}</span>
                </>
              )}
              {displayExpenseRatio != null && (
                <>
                  <span className="text-gray-300">·</span>
                  <span>Expense: {formatExpenseRatio(displayExpenseRatio)}</span>
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 mt-1">
              {fund.fund_manager && <span>Manager: {fund.fund_manager}</span>}
              {fund.inception_date && (
                <>
                  <span className="text-gray-300">·</span>
                  <span>Since: {formatDate(fund.inception_date)}</span>
                </>
              )}
              {fund.benchmark_index && (
                <>
                  <span className="text-gray-300">·</span>
                  <span>Benchmark: {fund.benchmark_index}</span>
                </>
              )}
            </div>
          </div>

          {/* Rank + Score */}
          {m && (
            <div className="shrink-0 text-right lg:min-w-[180px]">
              {m.rank_within_category != null && (
                <p className="text-sm text-gray-500 mb-1">
                  Rank <span className="text-lg font-bold text-gray-900">#{m.rank_within_category}</span> in {categoryLabel(fund.category)}
                </p>
              )}
              {m.composite_score != null && (
                <div>
                  <p className="text-sm text-gray-500">
                    Composite Score: <span className="text-lg font-bold text-indigo-700">{formatScore(m.composite_score)}</span> / 100
                  </p>
                  <div className="mt-1.5 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(m.composite_score, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Section 2 — Performance Metrics */}
      {m && (
        <div className="mb-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Performance</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            <ReturnCard label="1M Return" value={m.one_month_return} />
            <ReturnCard label="3M Return" value={m.three_month_return} />
            <ReturnCard label="6M Return" value={m.six_month_return} />
            <ReturnCard label="1Y Return" value={m.one_year_return} />
            <ReturnCard label="3Y CAGR" value={m.three_year_cagr} />
            <ReturnCard label="5Y CAGR" value={m.five_year_cagr} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <MetricCard
              label="Consistency"
              value={m.consistency_score != null ? `${formatScore(m.consistency_score)} / 100` : '—'}
            />
            <MetricCard
              label="Downside Protection"
              value={m.downside_protection_score != null ? `${formatScore(m.downside_protection_score)} / 100` : '—'}
            />
            <MetricCard
              label="Max Drawdown"
              value={m.max_drawdown != null ? `${m.max_drawdown.toFixed(1)}%` : '—'}
              negative
            />
            <MetricCard
              label="Sharpe Ratio"
              value={m.sharpe_ratio != null ? m.sharpe_ratio.toFixed(2) : '—'}
            />
            <MetricCard
              label="Volatility"
              value={m.annualised_volatility != null ? `${m.annualised_volatility.toFixed(1)}%` : '—'}
            />
          </div>
          {/* Second metrics row — new analytics */}
          <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
            <ReturnCard label="10Y CAGR" value={m.ten_year_cagr} />
            <MetricCard
              label="1Y Rank"
              value={m.one_year_rank != null ? `#${m.one_year_rank} in ${categoryLabel(fund.category)}` : '—'}
            />
            <MetricCard
              label="5Y Rank"
              value={m.five_year_rank != null ? `#${m.five_year_rank} in ${categoryLabel(fund.category)}` : '—'}
            />
            <MetricCard
              label="Fund Age"
              value={m.fund_age_years != null ? (m.fund_age_years >= 1 ? `${m.fund_age_years.toFixed(1)} yrs` : `${Math.round(m.fund_age_years * 12)} months`) : '—'}
            />
            <MetricCard
              label="Sortino Ratio"
              value={m.sortino_ratio != null ? m.sortino_ratio.toFixed(2) : '—'}
            />
            <MetricCard
              label="10Y Rank"
              value={m.ten_year_rank != null ? `#${m.ten_year_rank}` : '—'}
            />
            <MetricCard
              label="Data Quality"
              value={m.data_sufficiency || '—'}
            />
          </div>
        </div>
      )}

      {/* Section 2.5 — Plan/Option Switcher */}
      {hasMultipleSchemes && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Plan:</label>
              <select
                value={selectedPlan}
                onChange={(e) => {
                  setSelectedPlan(e.target.value);
                  // Reset option if current not available in new plan
                  const newOpts = schemes
                    .filter((s) => s.plan_type === e.target.value)
                    .map((s) => s.option_type);
                  if (!newOpts.includes(selectedOption)) {
                    setSelectedOption(newOpts[0] || 'GROWTH');
                  }
                }}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {['DIRECT', 'REGULAR'].map((plan) => (
                  <option
                    key={plan}
                    value={plan}
                    disabled={!availablePlans.includes(plan)}
                  >
                    {plan === 'DIRECT' ? 'Direct' : 'Regular'}
                    {!availablePlans.includes(plan) ? ' (N/A)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Option:</label>
              <select
                value={selectedOption}
                onChange={(e) => setSelectedOption(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {['GROWTH', 'IDCW'].map((opt) => (
                  <option
                    key={opt}
                    value={opt}
                    disabled={!availableOptions.includes(opt)}
                  >
                    {opt === 'GROWTH' ? 'Growth' : 'IDCW'}
                    {!availableOptions.includes(opt) ? ' (N/A)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {!isPrimarySelected && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
                </svg>
                NAV chart shows {selectedPlan === 'REGULAR' ? 'Regular' : 'Direct'} {selectedOption} · Metrics always use Direct Growth
              </span>
            )}

            {schemeNavLoading && (
              <span className="text-xs text-gray-400 animate-pulse">Loading scheme NAV...</span>
            )}
          </div>
        </div>
      )}

      {/* Section 3 — NAV Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">NAV History</h2>
            {navData && navData.length > 1 && (() => {
              const chartData = displayNavData || navData;
              const startVal = chartData[0].nav_value;
              const endVal = chartData[chartData.length - 1].nav_value;
              const periodReturn = startVal > 0 ? ((endVal - startVal) / startVal) * 100 : 0;
              return (
                <p className={`text-sm font-semibold mt-1 ${periodReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {periodReturn >= 0 ? '+' : ''}{periodReturn.toFixed(1)}% over this period
                </p>
              );
            })()}
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showCategoryAvg}
                onChange={() => setShowCategoryAvg(!showCategoryAvg)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
              />
              Category avg
            </label>
            <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
              {(['1M', '6M', '1Y', '3Y', '5Y', 'MAX'] as DateRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${dateRange === range
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>
        {(() => {
          const chartData = displayNavData || navData;
          return chartData && chartData.length > 0 ? (
            <NavLineChart
              data={chartData}
              isPositive={chartData.length > 1 ? chartData[chartData.length - 1].nav_value >= chartData[0].nav_value : true}
              startNav={chartData[0]?.nav_value}
            />
          ) : (
            <EmptyState heading="No NAV data" subtext="Upload NAV CSV to see historical chart" />
          );
        })()}
      </div>

      {/* Rolling Returns Summary */}
      {m && (m.rolling_1y_min != null || m.rolling_1y_max != null) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Rolling 1-Year Returns</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-xl font-bold text-red-700">{m.rolling_1y_min != null ? `${m.rolling_1y_min.toFixed(1)}%` : '—'}</p>
              <p className="text-xs text-red-600">Worst 1Y</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-xl font-bold text-green-700">{m.rolling_1y_max != null ? `${m.rolling_1y_max.toFixed(1)}%` : '—'}</p>
              <p className="text-xs text-green-600">Best 1Y</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-xl font-bold text-blue-700">{m.rolling_1y_mean != null ? `${m.rolling_1y_mean.toFixed(1)}%` : '—'}</p>
              <p className="text-xs text-blue-600">Average 1Y</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xl font-bold text-gray-700">{m.rolling_1y_std != null ? `${m.rolling_1y_std.toFixed(1)}%` : '—'}</p>
              <p className="text-xs text-gray-600">Std Dev</p>
            </div>
          </div>
        </div>
      )}

      {/* Section 4 — Portfolio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Holdings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Holdings</h2>
          {fund.holdings.length > 0 ? (
            <HoldingsTable holdings={fund.holdings.slice(0, 10)} />
          ) : (
            <EmptyState
              heading="No holdings data"
              subtext="Upload a factsheet to populate"
            />
          )}
        </div>

        {/* Sectors */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sector Allocation</h2>
          {fund.sector_allocations.length > 0 ? (
            <SectorPieChart data={fund.sector_allocations} />
          ) : (
            <EmptyState
              heading="No sector data"
              subtext="Upload a factsheet to see sector breakdown"
            />
          )}
        </div>
      </div>

      {/* Section 5 — SIP Calculator */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mt-6">
        <SIPCalculator
          fundName={fund.name}
          defaultRate={m?.five_year_cagr ?? m?.three_year_cagr ?? 12}
          rateSource={m?.five_year_cagr != null ? '5Y CAGR' : m?.three_year_cagr != null ? '3Y CAGR' : undefined}
        />
      </div>
    </PageWrapper>
  );
}

/** Return stat card — green/red/gray based on value */
function ReturnCard({ label, value }: { label: string; value: number | null }) {
  const color =
    value === null || value === undefined
      ? 'text-gray-400'
      : value > 0
        ? 'text-green-700'
        : value < 0
          ? 'text-red-600'
          : 'text-gray-700';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-center">
      <p className="text-xs text-gray-500 uppercase font-medium mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{formatReturn(value)}</p>
    </div>
  );
}

/** Generic metric card */
function MetricCard({
  label,
  value,
  negative,
}: {
  label: string;
  value: string;
  negative?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-center">
      <p className="text-xs text-gray-500 uppercase font-medium mb-1">{label}</p>
      <p className={`text-lg font-bold ${negative ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}
