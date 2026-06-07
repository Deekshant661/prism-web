import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  matchSchemes,
  importAllNavs,
  syncFundNav,
  runAllCalculations,
  getNavStatus,
  discoverAllSchemes,
  type MatchResult,
  type MatchResponse,
  type ImportAllResult,
  type DiscoverAllResult,
  type DiscoverFundResult,
} from '../api/dataManagement';
import { formatDate, categoryLabel } from '../utils/format';
import PageWrapper from '../components/layout/PageWrapper';
import Spinner from '../components/ui/Spinner';

export default function DataManagementPage() {
  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Data Management</h1>
      <p className="text-sm text-gray-500 mb-8">
        Import real NAV data from MFAPI and manage fund metrics
      </p>

      <div className="space-y-8">
        <SchemeMatchingCard />
        <NavImportCard />
        <SchemeDiscoveryCard />
        <DataStatusCard />
      </div>
    </PageWrapper>
  );
}

/* ─── Card 1: Scheme Matching ─── */
function SchemeMatchingCard() {
  const [matchResults, setMatchResults] = useState<MatchResult[] | null>(null);

  const matchMutation = useMutation({
    mutationFn: matchSchemes,
    onSuccess: (data: MatchResponse) => {
      setMatchResults(data.results);
      toast.success(`Matched ${data.matched} funds, ${data.unmatched} unmatched`);
    },
    onError: () => toast.error('Scheme matching failed'),
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold">1</span>
            Match Scheme Codes
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Link your funds to MFAPI scheme codes for NAV import
          </p>
        </div>
        <button
          onClick={() => matchMutation.mutate()}
          disabled={matchMutation.isPending}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {matchMutation.isPending && <Spinner size="sm" />}
          {matchMutation.isPending ? 'Matching...' : 'Match All Funds'}
        </button>
      </div>

      {matchResults && matchResults.length > 0 && (
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="text-left py-2.5 px-3 font-medium text-gray-500">Fund Name</th>
                <th className="text-left py-2.5 px-3 font-medium text-gray-500">Matched Scheme</th>
                <th className="text-right py-2.5 px-3 font-medium text-gray-500">Confidence</th>
                <th className="text-center py-2.5 px-3 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {matchResults.map((r) => (
                <tr key={r.fund_id} className="border-b border-gray-50">
                  <td className="py-2.5 px-3 font-medium text-gray-900">{r.fund_name}</td>
                  <td className="py-2.5 px-3 text-gray-600 max-w-[300px] truncate">
                    {r.scheme_name || '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right text-gray-700">
                    {r.confidence > 0 ? `${r.confidence.toFixed(1)}%` : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {r.matched ? (
                      <span className="inline-flex items-center gap-1 text-green-700 text-xs font-semibold bg-green-50 px-2 py-0.5 rounded-full">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Matched
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600 text-xs font-semibold bg-red-50 px-2 py-0.5 rounded-full">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Not found
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Card 2: NAV Import ─── */
function NavImportCard() {
  const queryClient = useQueryClient();
  const [importResult, setImportResult] = useState<ImportAllResult | null>(null);

  const { data: status } = useQuery({
    queryKey: ['navStatus'],
    queryFn: getNavStatus,
    staleTime: 30 * 1000,
  });

  const matchedCount = status?.filter((s) => s.scheme_matched).length || 0;
  const totalCount = status?.length || 0;

  const importMutation = useMutation({
    mutationFn: importAllNavs,
    onSuccess: (data) => {
      setImportResult(data);
      queryClient.invalidateQueries({ queryKey: ['navStatus'] });
      toast.success(`Imported ${data.total_inserted.toLocaleString()} NAV records`);
    },
    onError: () => toast.error('NAV import failed'),
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold">2</span>
            Import NAV Data
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Download full historical NAV data for all matched funds
          </p>
        </div>
        <button
          onClick={() => importMutation.mutate()}
          disabled={importMutation.isPending || matchedCount === 0}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {importMutation.isPending && <Spinner size="sm" />}
          {importMutation.isPending ? 'Importing...' : 'Import All Funds'}
        </button>
      </div>

      <div className="flex items-center gap-4 text-sm mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-gray-700">
            Matched: <strong>{matchedCount}</strong> / {totalCount}
          </span>
        </div>
        {matchedCount === 0 && (
          <span className="text-amber-600 text-xs">
            ↑ Run scheme matching first
          </span>
        )}
      </div>

      {importMutation.isPending && (
        <div className="bg-indigo-50 rounded-lg p-4 flex items-center gap-3">
          <Spinner size="sm" />
          <p className="text-sm text-indigo-700">
            Importing NAV data... this may take a minute
          </p>
        </div>
      )}

      {importResult && !importMutation.isPending && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{importResult.funds_processed}</p>
              <p className="text-xs text-gray-500">Funds processed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-700">
                {importResult.total_inserted.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Records imported</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-500">{importResult.errors.length}</p>
              <p className="text-xs text-gray-500">Errors</p>
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <div className="mt-3 text-xs text-red-600">
              {importResult.errors.map((err, i) => (
                <p key={i}>⚠ {err}</p>
              ))}
            </div>
          )}

          <div className="pt-2">
            <Link
              to="/rankings"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View Rankings →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Card 3: Scheme Discovery ─── */
function SchemeDiscoveryCard() {
  const [discoverResult, setDiscoverResult] = useState<DiscoverAllResult | null>(null);

  const discoverMutation = useMutation({
    mutationFn: discoverAllSchemes,
    onSuccess: (data: DiscoverAllResult) => {
      setDiscoverResult(data);
      toast.success(`Discovered ${data.total_discovered} new scheme variants`);
    },
    onError: () => toast.error('Scheme discovery failed'),
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold">3</span>
            Scheme Discovery
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Discover Direct/Regular/IDCW variants for all funds via MFAPI
          </p>
        </div>
        <button
          onClick={() => discoverMutation.mutate()}
          disabled={discoverMutation.isPending}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {discoverMutation.isPending && <Spinner size="sm" />}
          {discoverMutation.isPending ? 'Discovering...' : 'Discover All Scheme Variants'}
        </button>
      </div>

      {discoverResult && (
        <div className="space-y-3">
          <div className="flex gap-6 text-sm">
            <span className="text-gray-500">
              Funds processed: <span className="font-semibold text-gray-900">{discoverResult.funds_processed}</span>
            </span>
            <span className="text-gray-500">
              New variants: <span className="font-semibold text-green-700">{discoverResult.total_discovered}</span>
            </span>
            <span className="text-gray-500">
              Already existed: <span className="font-semibold text-gray-600">{discoverResult.total_already_existed}</span>
            </span>
          </div>

          {discoverResult.fund_results.length > 0 && (
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="text-left py-2.5 px-3 font-medium text-gray-500">Fund Name</th>
                    <th className="text-center py-2.5 px-3 font-medium text-gray-500">Primary</th>
                    <th className="text-right py-2.5 px-3 font-medium text-gray-500">Variants Found</th>
                  </tr>
                </thead>
                <tbody>
                  {discoverResult.fund_results
                    .filter((f) => f.total_schemes > 0)
                    .sort((a, b) => b.total_schemes - a.total_schemes)
                    .map((fund, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="py-2 px-3 text-gray-900">{fund.fund_name}</td>
                      <td className="py-2 px-3 text-center text-gray-500">Direct Growth</td>
                      <td className="py-2 px-3 text-right">
                        {fund.discovered > 0 ? (
                          <span className="text-green-700 font-medium">+{fund.discovered} new</span>
                        ) : (
                          <span className="text-gray-400">{fund.already_existed} existing</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {discoverResult.errors.length > 0 && (
            <div className="mt-3 text-xs text-red-600">
              {discoverResult.errors.map((err, i) => (
                <p key={i}>⚠ {err}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Card 4: Data Status ─── */
function DataStatusCard() {
  const queryClient = useQueryClient();

  const { data: status, isLoading } = useQuery({
    queryKey: ['navStatus'],
    queryFn: getNavStatus,
    staleTime: 30 * 1000,
  });

  const calcMutation = useMutation({
    mutationFn: runAllCalculations,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navStatus'] });
      toast.success('Metrics recalculated');
    },
    onError: () => toast.error('Calculation failed'),
  });

  const syncMutation = useMutation({
    mutationFn: syncFundNav,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navStatus'] });
      toast.success('Fund synced and metrics updated');
    },
    onError: () => toast.error('Sync failed'),
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold">4</span>
            Fund Data Status
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Real-time view of data completeness per fund
          </p>
        </div>
        <button
          onClick={() => calcMutation.mutate()}
          disabled={calcMutation.isPending}
          className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {calcMutation.isPending && <Spinner size="sm" />}
          {calcMutation.isPending ? 'Calculating...' : 'Recalculate All Metrics'}
        </button>
      </div>

      {isLoading ? (
        <Spinner size="lg" />
      ) : !status || status.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">No funds found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="text-left py-2.5 px-3 font-medium text-gray-500">Fund</th>
                <th className="text-center py-2.5 px-3 font-medium text-gray-500">Scheme</th>
                <th className="text-right py-2.5 px-3 font-medium text-gray-500">NAV Records</th>
                <th className="text-center py-2.5 px-3 font-medium text-gray-500">Eligible</th>
                <th className="text-left py-2.5 px-3 font-medium text-gray-500">Date Range</th>
                <th className="text-left py-2.5 px-3 font-medium text-gray-500">Metrics Updated</th>
                <th className="text-right py-2.5 px-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {status.map((fund) => (
                <tr key={fund.fund_id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-2.5 px-3">
                    <Link
                      to={`/fund/${fund.fund_id}`}
                      className="font-medium text-gray-900 hover:text-indigo-600 transition-colors"
                    >
                      {fund.fund_name}
                    </Link>
                    <p className="text-xs text-gray-400">{categoryLabel(fund.category)}</p>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {fund.scheme_matched ? (
                      <span className="inline-flex items-center text-green-700 text-xs font-semibold bg-green-50 px-2 py-0.5 rounded-full">
                        ✓ {fund.scheme_code}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-gray-900">
                    {fund.nav_record_count > 0
                      ? fund.nav_record_count.toLocaleString()
                      : <span className="text-gray-400">0</span>
                    }
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {fund.ranking_eligible ? (
                      <span className="inline-flex items-center text-green-700 text-xs font-semibold bg-green-50 px-2 py-0.5 rounded-full" title="Ranking eligible">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 text-amber-700 text-xs font-semibold bg-amber-50 px-2 py-0.5 rounded-full cursor-help"
                        title={fund.ineligibility_reason || 'Not eligible'}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                        </svg>
                        <span className="max-w-[150px] truncate">{fund.ineligibility_reason || '—'}</span>
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-gray-600 text-xs">
                    {fund.earliest_nav_date && fund.latest_nav_date
                      ? `${formatDate(fund.earliest_nav_date)} — ${formatDate(fund.latest_nav_date)}`
                      : <span className="text-gray-400">—</span>
                    }
                  </td>
                  <td className="py-2.5 px-3 text-xs text-gray-500">
                    {fund.metrics_last_updated
                      ? formatDate(fund.metrics_last_updated)
                      : <span className="text-gray-400">Never</span>
                    }
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      {fund.scheme_matched && (
                        <button
                          onClick={() => syncMutation.mutate(fund.fund_id)}
                          disabled={syncMutation.isPending}
                          className="px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-md hover:bg-indigo-100 disabled:opacity-50 transition-colors"
                          title="Sync latest NAV data"
                        >
                          Sync
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
