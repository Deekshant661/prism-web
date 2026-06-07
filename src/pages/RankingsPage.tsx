import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useRankings } from '../hooks/useRankings';
import type { FundCategory } from '../types/fund';
import type { RankedFund } from '../types/ranking';
import { categoryLabel, formatReturn, formatScore } from '../utils/format';
import PageWrapper from '../components/layout/PageWrapper';
import Spinner from '../components/ui/Spinner';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';

const CATEGORIES: (FundCategory | 'ALL')[] = [
  'ALL', 'LARGE_CAP', 'MID_CAP', 'SMALL_CAP', 'FLEXI_CAP', 'ELSS', 'INDEX', 'DEBT', 'BALANCED_ADVANTAGE',
];

// Fund type badge colors
const FUND_TYPE_COLORS: Record<string, string> = {
  Equity: 'bg-blue-100 text-blue-700',
  Hybrid: 'bg-teal-100 text-teal-700',
  Index: 'bg-gray-100 text-gray-700',
  'Tax Saving (ELSS)': 'bg-green-100 text-green-700',
  Debt: 'bg-yellow-100 text-yellow-700',
};

// Column definitions
type ColumnKey =
  | 'rank' | 'fund' | 'type' | 'age' | 'expenseRatio'
  | '1y' | '1yRank' | '3y' | '5y' | '5yRank' | '10y' | 'score' | 'sharpe';

interface ColumnDef {
  key: ColumnKey;
  label: string;
  shortLabel: string;
  defaultVisible: boolean;
  mobileVisible: boolean;
  align: 'left' | 'right';
}

const COLUMNS: ColumnDef[] = [
  { key: 'rank',         label: 'Rank',       shortLabel: '#',      defaultVisible: true,  mobileVisible: true,  align: 'left' },
  { key: 'fund',         label: 'Fund',       shortLabel: 'Fund',   defaultVisible: true,  mobileVisible: true,  align: 'left' },
  { key: 'type',         label: 'Type',       shortLabel: 'Type',   defaultVisible: true,  mobileVisible: false, align: 'left' },
  { key: 'age',          label: 'Age',        shortLabel: 'Age',    defaultVisible: false, mobileVisible: false, align: 'right' },
  { key: 'expenseRatio', label: 'Exp. Ratio', shortLabel: 'ER',     defaultVisible: false, mobileVisible: false, align: 'right' },
  { key: '1y',           label: '1Y Ret.',    shortLabel: '1Y',     defaultVisible: true,  mobileVisible: true,  align: 'right' },
  { key: '1yRank',       label: '1Y Rank',    shortLabel: '1Y#',    defaultVisible: false, mobileVisible: false, align: 'right' },
  { key: '3y',           label: '3Y CAGR',    shortLabel: '3Y',     defaultVisible: true,  mobileVisible: false, align: 'right' },
  { key: '5y',           label: '5Y CAGR',    shortLabel: '5Y',     defaultVisible: true,  mobileVisible: false, align: 'right' },
  { key: '5yRank',       label: '5Y Rank',    shortLabel: '5Y#',    defaultVisible: false, mobileVisible: false, align: 'right' },
  { key: '10y',          label: '10Y CAGR',   shortLabel: '10Y',    defaultVisible: false, mobileVisible: false, align: 'right' },
  { key: 'score',        label: 'Score',      shortLabel: 'Score',  defaultVisible: true,  mobileVisible: true,  align: 'right' },
  { key: 'sharpe',       label: 'Sharpe',     shortLabel: 'Sharpe', defaultVisible: false, mobileVisible: false, align: 'right' },
];

// Watchlist helpers
function getWatchlist(): string[] {
  try { return JSON.parse(localStorage.getItem('mf_watchlist') || '[]'); }
  catch { return []; }
}
function toggleWatchlist(id: string): boolean {
  const list = getWatchlist();
  const idx = list.indexOf(id);
  if (idx >= 0) { list.splice(idx, 1); }
  else { list.push(id); }
  localStorage.setItem('mf_watchlist', JSON.stringify(list));
  return idx < 0;
}

interface Filters {
  maxExpenseRatio: number;
  minAum: number;
  minCagr3y: number;
  maxDrawdown: number;
  maxVolatility: number;
  fullDataOnly: boolean;
}

const DEFAULT_FILTERS: Filters = {
  maxExpenseRatio: 3,
  minAum: 0,
  minCagr3y: -100,
  maxDrawdown: 0,
  maxVolatility: 100,
  fullDataOnly: false,
};

function countActiveFilters(f: Filters): number {
  let count = 0;
  if (f.maxExpenseRatio < 3) count++;
  if (f.minAum > 0) count++;
  if (f.minCagr3y > -100) count++;
  if (f.maxDrawdown < 0) count++;
  if (f.maxVolatility < 100) count++;
  if (f.fullDataOnly) count++;
  return count;
}

export default function RankingsPage() {
  const { category: paramCategory } = useParams<{ category: string }>();
  const navigate = useNavigate();

  const activeCategory = (paramCategory?.toUpperCase() || 'ALL') as FundCategory | 'ALL';
  const categoryParam = activeCategory === 'ALL' ? undefined : activeCategory as FundCategory;

  const { data: rankings, isLoading, error } = useRankings({ category: categoryParam });
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => new Set(getWatchlist()));
  const [visibleCols, setVisibleCols] = useState<Set<ColumnKey>>(() =>
    new Set(COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key))
  );

  // Apply search + filters
  const filteredFunds = useMemo(() => {
    if (!rankings?.funds) return [];
    let funds = rankings.funds;

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase();
      funds = funds.filter(
        (f) =>
          f.fund_name.toLowerCase().includes(q) ||
          f.amc?.toLowerCase().includes(q)
      );
    }

    // Filters
    funds = funds.filter((f) => {
      if (f.expense_ratio != null && f.expense_ratio > filters.maxExpenseRatio) return false;
      if (f.aum_cr != null && f.aum_cr < filters.minAum) return false;
      if (filters.minCagr3y > -100 && (f.three_year_cagr == null || f.three_year_cagr < filters.minCagr3y)) return false;
      if (filters.maxDrawdown < 0 && (f.max_drawdown == null || f.max_drawdown < filters.maxDrawdown)) return false;
      if (filters.maxVolatility < 100 && (f.annualised_volatility == null || f.annualised_volatility > filters.maxVolatility)) return false;
      if (filters.fullDataOnly && f.data_sufficiency !== 'FULL') return false;
      return true;
    });

    return funds;
  }, [rankings, search, filters]);

  const activeFilterCount = countActiveFilters(filters);

  const toggleCol = (key: ColumnKey) => {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Active columns for rendering (always include rank + fund on mobile)
  const activeColumns = COLUMNS.filter((c) => visibleCols.has(c.key));

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Fund Rankings</h1>
      <p className="text-sm text-gray-500 mb-6">Performance-ranked funds by category</p>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => navigate(cat === 'ALL' ? '/rankings' : `/rankings/${cat.toLowerCase()}`)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {categoryLabel(cat)}
          </button>
        ))}
      </div>

      {/* Search + Filter toggle + Columns toggle */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Search by name or AMC..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px] max-w-md focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors flex items-center gap-1.5 ${
            showFilters ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-indigo-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
        <div className="relative">
          <button
            onClick={() => setShowColumns(!showColumns)}
            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors flex items-center gap-1.5 ${
              showColumns ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 4h6m-6 4h6m-6 4h6M4 4v16m16-16v16" />
            </svg>
            Columns
          </button>
          {showColumns && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20 w-52">
              {COLUMNS.filter((c) => c.key !== 'rank' && c.key !== 'fund').map((col) => (
                <label key={col.key} className="flex items-center gap-2 py-1 text-sm text-gray-700 cursor-pointer hover:text-gray-900">
                  <input
                    type="checkbox"
                    checked={visibleCols.has(col.key)}
                    onChange={() => toggleCol(col.key)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  {col.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Smart Filters</h3>
            <button
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Reset Filters
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <FilterSlider
              label="Max Expense Ratio"
              value={filters.maxExpenseRatio}
              onChange={(v) => setFilters({ ...filters, maxExpenseRatio: v })}
              min={0} max={3} step={0.1}
              format={(v) => `${v.toFixed(1)}%`}
            />
            <FilterSlider
              label="Min AUM"
              value={filters.minAum}
              onChange={(v) => setFilters({ ...filters, minAum: v })}
              min={0} max={100000} step={500}
              format={(v) => `₹${(v / 1000).toFixed(0)}K Cr`}
            />
            <FilterSlider
              label="Min 3Y CAGR"
              value={filters.minCagr3y}
              onChange={(v) => setFilters({ ...filters, minCagr3y: v })}
              min={-100} max={50} step={1}
              format={(v) => `${v.toFixed(0)}%`}
            />
            <FilterSlider
              label="Max Drawdown"
              value={filters.maxDrawdown}
              onChange={(v) => setFilters({ ...filters, maxDrawdown: v })}
              min={-80} max={0} step={1}
              format={(v) => `${v.toFixed(0)}%`}
            />
            <FilterSlider
              label="Max Volatility"
              value={filters.maxVolatility}
              onChange={(v) => setFilters({ ...filters, maxVolatility: v })}
              min={0} max={100} step={1}
              format={(v) => `${v.toFixed(0)}%`}
            />
            <div>
              <p className="text-xs text-gray-500 uppercase mb-2">Data Quality</p>
              <button
                onClick={() => setFilters({ ...filters, fullDataOnly: !filters.fullDataOnly })}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors w-full ${
                  filters.fullDataOnly
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                {filters.fullDataOnly ? 'Full only' : 'All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <Spinner size="lg" />
      ) : error ? (
        <ErrorState message="Failed to load rankings" />
      ) : filteredFunds.length === 0 ? (
        <EmptyState heading="No funds match" subtext="Try adjusting your filters or search" />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  {/* Bookmark column (always shown) */}
                  <th className="text-left py-3 px-1 w-6"></th>
                  {activeColumns.map((col) => (
                    <th
                      key={col.key}
                      className={`py-3 px-4 font-medium text-gray-500 ${
                        col.align === 'right' ? 'text-right' : 'text-left'
                      } ${col.mobileVisible ? '' : 'hidden md:table-cell'}`}
                    >
                      <span className="hidden md:inline">{col.label}</span>
                      <span className="md:hidden">{col.shortLabel}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredFunds.map((fund) => (
                  <FundRow
                    key={fund.fund_id}
                    fund={fund}
                    columns={activeColumns}
                    isBookmarked={bookmarks.has(fund.fund_id)}
                    onToggleBookmark={() => {
                      const nowBookmarked = toggleWatchlist(fund.fund_id);
                      setBookmarks((prev) => {
                        const next = new Set(prev);
                        if (nowBookmarked) next.add(fund.fund_id);
                        else next.delete(fund.fund_id);
                        return next;
                      });
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 text-xs text-gray-500 border-t border-gray-100">
            Showing {filteredFunds.length} of {rankings?.total || 0} eligible funds
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

function FundRow({
  fund,
  columns,
  isBookmarked,
  onToggleBookmark,
}: {
  fund: RankedFund;
  columns: ColumnDef[];
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}) {
  const returnColor = (v: number | null) =>
    v == null ? 'text-gray-400' : v > 0 ? 'text-green-700' : v < 0 ? 'text-red-600' : 'text-gray-700';

  const renderCell = (col: ColumnDef) => {
    switch (col.key) {
      case 'rank':
        return <span className="text-gray-500 font-medium">{fund.rank || '—'}</span>;
      case 'fund':
        return (
          <Link to={`/fund/${fund.fund_id}`} className="hover:text-indigo-600 transition-colors">
            <p className="font-medium text-gray-900">{fund.fund_name}</p>
            <p className="text-xs text-gray-500">{fund.amc}</p>
          </Link>
        );
      case 'type':
        return fund.fund_type ? (
          <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${FUND_TYPE_COLORS[fund.fund_type] || 'bg-gray-100 text-gray-700'}`}>
            {fund.fund_type}
          </span>
        ) : null;
      case 'age':
        return <span className="text-gray-700">{fund.fund_age || '—'}</span>;
      case 'expenseRatio':
        return <span className="text-gray-700">{fund.expense_ratio != null ? `${fund.expense_ratio.toFixed(2)}%` : '—'}</span>;
      case '1y':
        return <span className={`font-medium ${returnColor(fund.one_year_return)}`}>{formatReturn(fund.one_year_return)}</span>;
      case '1yRank':
        return fund.one_year_rank != null ? (
          <span className="text-gray-500 text-xs">#{fund.one_year_rank}</span>
        ) : <span className="text-gray-400">—</span>;
      case '3y':
        return <span className={`font-medium ${returnColor(fund.three_year_cagr)}`}>{formatReturn(fund.three_year_cagr)}</span>;
      case '5y':
        return <span className={`font-medium ${returnColor(fund.five_year_cagr)}`}>{formatReturn(fund.five_year_cagr)}</span>;
      case '5yRank':
        return fund.five_year_rank != null ? (
          <span className="text-gray-500 text-xs">#{fund.five_year_rank}</span>
        ) : <span className="text-gray-400">—</span>;
      case '10y':
        return fund.ten_year_cagr != null ? (
          <span className={`font-medium ${returnColor(fund.ten_year_cagr)}`}>{formatReturn(fund.ten_year_cagr)}</span>
        ) : <span className="text-gray-400">—</span>;
      case 'score':
        return fund.composite_score != null ? (
          <div className="flex items-center justify-end gap-2">
            <span className="font-bold text-gray-900">{formatScore(fund.composite_score)}</span>
            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full"
                style={{ width: `${Math.min(fund.composite_score, 100)}%` }}
              />
            </div>
          </div>
        ) : <span className="text-gray-400">—</span>;
      case 'sharpe':
        return <span className="text-gray-700">{fund.sharpe_ratio != null ? fund.sharpe_ratio.toFixed(2) : '—'}</span>;
      default:
        return null;
    }
  };

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      {/* Bookmark */}
      <td className="py-3 px-1">
        <button onClick={onToggleBookmark} className="text-gray-400 hover:text-indigo-600 transition-colors">
          {isBookmarked ? (
            <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 3a2 2 0 00-2 2v16l9-4 9 4V5a2 2 0 00-2-2H5z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
            </svg>
          )}
        </button>
      </td>
      {columns.map((col) => (
        <td
          key={col.key}
          className={`py-3 px-4 ${col.align === 'right' ? 'text-right' : 'text-left'} ${col.mobileVisible ? '' : 'hidden md:table-cell'}`}
        >
          {renderCell(col)}
        </td>
      ))}
    </tr>
  );
}

function FilterSlider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
}) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-900 mb-1.5">{format(value)}</p>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
      />
    </div>
  );
}
