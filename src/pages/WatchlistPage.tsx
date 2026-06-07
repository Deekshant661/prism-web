import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listFunds } from '../api/funds';
import { formatReturn, formatScore } from '../utils/format';
import PageWrapper from '../components/layout/PageWrapper';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';

function getWatchlist(): string[] {
  try { return JSON.parse(localStorage.getItem('mf_watchlist') || '[]'); }
  catch { return []; }
}

function removeFromWatchlist(id: string) {
  const list = getWatchlist().filter((x) => x !== id);
  localStorage.setItem('mf_watchlist', JSON.stringify(list));
}

export default function WatchlistPage() {
  const [watchlistIds, setWatchlistIds] = useState<string[]>(() => getWatchlist());

  const { data: allFunds, isLoading } = useQuery({
    queryKey: ['funds'],
    queryFn: listFunds,
    staleTime: 5 * 60 * 1000,
  });

  const watchedFunds = useMemo(() => {
    if (!allFunds) return [];
    return watchlistIds
      .map((id) => allFunds.find((f) => f.id === id))
      .filter(Boolean) as typeof allFunds;
  }, [allFunds, watchlistIds]);

  const handleRemove = (id: string) => {
    removeFromWatchlist(id);
    setWatchlistIds(getWatchlist());
  };

  if (isLoading) return <Spinner size="lg" />;

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Watchlist</h1>
      <p className="text-sm text-gray-500 mb-6">
        {watchedFunds.length} fund{watchedFunds.length !== 1 ? 's' : ''} saved
      </p>

      {watchedFunds.length === 0 ? (
        <EmptyState
          heading="No funds saved yet"
          subtext="Click the bookmark icon on any fund to save it here."
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Fund</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Category</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">1Y</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">3Y</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Score</th>
                  <th className="py-3 px-4 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {watchedFunds.map((fund) => {
                  const m = (fund as any).metrics;
                  const returnColor = (v: number | null) =>
                    v == null ? 'text-gray-400' : v > 0 ? 'text-green-700' : v < 0 ? 'text-red-600' : 'text-gray-700';
                  return (
                    <tr key={fund.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-3 px-4">
                        <Link to={`/fund/${fund.id}`} className="hover:text-indigo-600 transition-colors">
                          <p className="font-medium text-gray-900">{fund.name}</p>
                          <p className="text-xs text-gray-500">{fund.amc}</p>
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <Badge category={fund.category} />
                      </td>
                      <td className={`py-3 px-4 text-right font-medium ${returnColor(m?.one_year_return)}`}>
                        {formatReturn(m?.one_year_return ?? null)}
                      </td>
                      <td className={`py-3 px-4 text-right font-medium ${returnColor(m?.three_year_cagr)}`}>
                        {formatReturn(m?.three_year_cagr ?? null)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-gray-900">
                        {formatScore(m?.composite_score ?? null)}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleRemove(fund.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="Remove from watchlist"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
