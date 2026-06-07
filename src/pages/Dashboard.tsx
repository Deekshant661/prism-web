import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useRankings } from '../hooks/useRankings';
import { runAllCalculations } from '../api/calculations';
import type { FundCategory } from '../types/fund';
import { categoryLabel, formatReturn, formatScore } from '../utils/format';
import PageWrapper from '../components/layout/PageWrapper';

const CATEGORIES: FundCategory[] = [
  'LARGE_CAP', 'MID_CAP', 'SMALL_CAP', 'FLEXI_CAP', 'ELSS', 'INDEX', 'DEBT', 'BALANCED_ADVANTAGE',
];

const categoryGradients: Record<string, string> = {
  LARGE_CAP: 'from-blue-500 to-blue-600',
  MID_CAP: 'from-violet-500 to-violet-600',
  SMALL_CAP: 'from-orange-500 to-orange-600',
  FLEXI_CAP: 'from-teal-500 to-teal-600',
  ELSS: 'from-green-500 to-green-600',
  INDEX: 'from-gray-500 to-gray-600',
  DEBT: 'from-yellow-500 to-yellow-600',
  BALANCED_ADVANTAGE: 'from-emerald-500 to-emerald-600',
};

const categoryIcons: Record<string, string> = {
  LARGE_CAP: '🏛️',
  MID_CAP: '🚀',
  SMALL_CAP: '💎',
  FLEXI_CAP: '🔄',
  ELSS: '🛡️',
  INDEX: '📊',
  DEBT: '🏦',
  BALANCED_ADVANTAGE: '⚖️',
};

function CategoryCard({ category }: { category: FundCategory }) {
  const navigate = useNavigate();
  const { data, isLoading } = useRankings({ category, limit: 1 });

  const topFund = data?.funds?.[0];
  const total = data?.total || 0;

  // Calculate average score
  const avgScore = topFund?.composite_score ? topFund.composite_score : null;

  return (
    <div
      onClick={() => navigate(`/rankings/${category}`)}
      className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer overflow-hidden"
    >
      <div className={`h-1.5 bg-gradient-to-r ${categoryGradients[category]}`} />
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{categoryIcons[category]}</span>
            <h3 className="text-base font-bold text-gray-900">{categoryLabel(category)}</h3>
          </div>
          <span className="text-xs text-gray-400 font-medium">{total} funds</span>
        </div>

        {isLoading ? (
          <div className="h-16 flex items-center justify-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
          </div>
        ) : topFund ? (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Top Score</span>
              <span className="font-semibold text-gray-900">{formatScore(avgScore)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Best 1Y</span>
              <span className={`font-semibold ${(topFund.one_year_return || 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {formatReturn(topFund.one_year_return)}
              </span>
            </div>
            <p className="text-xs text-gray-400 truncate pt-1 border-t border-gray-100">
              {topFund.fund_name}
            </p>
          </div>
        ) : (
          <p className="text-xs text-gray-400 py-4">No data yet</p>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const calcMutation = useMutation({
    mutationFn: runAllCalculations,
    onSuccess: () => {
      toast.success('Calculations complete! Rankings refreshed.');
      queryClient.invalidateQueries({ queryKey: ['rankings'] });
    },
    onError: () => {
      toast.error('Calculation failed. Check the backend logs.');
    },
  });

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of all mutual fund categories</p>
        </div>
        <button
          onClick={() => calcMutation.mutate()}
          disabled={calcMutation.isPending}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {calcMutation.isPending ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Running...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Run Calculations
            </>
          )}
        </button>
      </div>

      {/* Category Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
        {CATEGORIES.map((cat) => (
          <CategoryCard key={cat} category={cat} />
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/rankings')}
          className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
              <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">View Rankings</p>
              <p className="text-xs text-gray-500">Compare funds across categories</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/compare')}
          className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Compare Funds</p>
              <p className="text-xs text-gray-500">Side-by-side fund analysis</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/upload')}
          className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
              <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Upload Data</p>
              <p className="text-xs text-gray-500">Import NAV CSV or factsheets</p>
            </div>
          </div>
        </button>
      </div>
    </PageWrapper>
  );
}
