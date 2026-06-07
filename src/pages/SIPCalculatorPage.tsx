import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { listFunds } from '../api/funds';
import { getFund } from '../api/funds';
import { formatINR, formatINRShort, categoryLabel } from '../utils/format';
import { calculateSIP } from '../components/calculators/SIPCalculator';
import SIPCalculator from '../components/calculators/SIPCalculator';
import PageWrapper from '../components/layout/PageWrapper';
import Badge from '../components/ui/Badge';

const COMPARE_COLORS = ['#6366f1', '#10b981', '#f59e0b'];

export default function SIPCalculatorPage() {
  const [selectedFundId, setSelectedFundId] = useState<string>('');
  const [compareFundIds, setCompareFundIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [sipAmount, setSipAmount] = useState(5000);
  const [sipYears, setSipYears] = useState(15);

  const { data: allFunds } = useQuery({
    queryKey: ['funds'],
    queryFn: listFunds,
    staleTime: 10 * 60 * 1000,
  });

  // Fetch details for selected fund
  const { data: selectedFundDetail } = useQuery({
    queryKey: ['fund', selectedFundId],
    queryFn: () => getFund(selectedFundId),
    enabled: !!selectedFundId,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch details for compare funds
  const compareFundQueries = compareFundIds.map((id) => ({
    queryKey: ['fund', id],
    queryFn: () => getFund(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  }));

  // Simple approach: use useQuery individually for up to 3 funds
  const { data: compareFund0 } = useQuery({
    ...compareFundQueries[0] || { queryKey: ['fund', 'none0'], queryFn: () => null, enabled: false },
  });
  const { data: compareFund1 } = useQuery({
    ...compareFundQueries[1] || { queryKey: ['fund', 'none1'], queryFn: () => null, enabled: false },
  });
  const { data: compareFund2 } = useQuery({
    ...compareFundQueries[2] || { queryKey: ['fund', 'none2'], queryFn: () => null, enabled: false },
  });

  const compareFundDetails = [compareFund0, compareFund1, compareFund2].filter(Boolean) as NonNullable<typeof selectedFundDetail>[];

  const defaultRate = selectedFundDetail?.metrics?.five_year_cagr
    ?? selectedFundDetail?.metrics?.three_year_cagr
    ?? 12;

  const rateSource = selectedFundDetail
    ? (selectedFundDetail.metrics?.five_year_cagr != null ? '5Y CAGR' : selectedFundDetail.metrics?.three_year_cagr != null ? '3Y CAGR' : undefined)
    : undefined;

  // Search filtering
  const filteredFunds = useMemo(() => {
    if (!allFunds || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return allFunds
      .filter((f) =>
        !compareFundIds.includes(f.id) &&
        (f.name.toLowerCase().includes(q) || (f.amc || '').toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [allFunds, searchQuery, compareFundIds]);

  const addCompareFund = (fundId: string) => {
    if (compareFundIds.length < 3 && !compareFundIds.includes(fundId)) {
      setCompareFundIds([...compareFundIds, fundId]);
    }
    setSearchQuery('');
    setShowDropdown(false);
  };

  const removeCompareFund = (id: string) => {
    setCompareFundIds(compareFundIds.filter((fid) => fid !== id));
  };

  // Build comparison data
  const comparisonData = useMemo(() => {
    if (compareFundDetails.length === 0) return null;
    return compareFundDetails.map((fund) => {
      const rate = fund.metrics?.five_year_cagr ?? fund.metrics?.three_year_cagr ?? 12;
      const { futureValue, totalInvested, gains } = calculateSIP(sipAmount, rate, sipYears);
      return {
        name: fund.name.split(' ').slice(0, 3).join(' '),
        fullName: fund.name,
        rate,
        futureValue,
        totalInvested,
        gains,
        fundId: fund.id,
      };
    });
  }, [compareFundDetails, sipAmount, sipYears]);

  // Bar chart data
  const barChartData = comparisonData?.map((d, idx) => ({
    name: d.name,
    corpus: Math.round(d.futureValue),
    invested: Math.round(d.totalInvested),
    gains: Math.round(d.gains),
    color: COMPARE_COLORS[idx % COMPARE_COLORS.length],
  }));

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">SIP Calculator</h1>
      <p className="text-sm text-gray-500 mb-6">Calculate returns for Systematic Investment Plans</p>

      {/* Fund selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
        <label className="block text-xs font-medium text-gray-500 uppercase mb-2">
          Select a fund (optional)
        </label>
        <select
          value={selectedFundId}
          onChange={(e) => setSelectedFundId(e.target.value)}
          className="w-full max-w-md border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="">No fund — use default 12% rate</option>
          {allFunds?.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} ({categoryLabel(f.category)})
            </option>
          ))}
        </select>
      </div>

      {/* Main SIP Calculator */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
        <SIPCalculator
          fundName={selectedFundDetail?.name}
          defaultRate={defaultRate}
          rateSource={rateSource}
        />
      </div>

      {/* Comparison Mode */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Compare SIP Outcomes</h2>
        <p className="text-sm text-gray-500 mb-4">Add up to 3 funds to compare their SIP outcomes side by side</p>

        {/* Fund chips */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {compareFundIds.map((id) => {
            const fund = allFunds?.find((f) => f.id === id);
            return (
              <span key={id} className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium px-3 py-1.5 rounded-full">
                {fund?.name || 'Loading...'}
                <button onClick={() => removeCompareFund(id)} className="hover:text-indigo-900 transition-colors">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            );
          })}
        </div>

        {/* Search for compare funds */}
        {compareFundIds.length < 3 && (
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Search and add funds to compare..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full max-w-md focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            {showDropdown && filteredFunds.length > 0 && (
              <div className="absolute z-10 mt-1 w-full max-w-md bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredFunds.map((fund) => (
                  <button
                    key={fund.id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => addCompareFund(fund.id)}
                    className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Badge category={fund.category} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{fund.name}</p>
                      <p className="text-xs text-gray-500">{fund.amc}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SIP Parameters for comparison */}
        {compareFundIds.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6 max-w-sm">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Monthly SIP</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input
                    type="number"
                    value={sipAmount}
                    onChange={(e) => setSipAmount(Math.max(500, Number(e.target.value)))}
                    className="w-full pl-7 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Period</label>
                <div className="relative">
                  <input
                    type="number"
                    value={sipYears}
                    onChange={(e) => setSipYears(Math.max(1, Math.min(40, Number(e.target.value))))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Years</span>
                </div>
              </div>
            </div>

            {/* Comparison Table */}
            {comparisonData && comparisonData.length > 0 && (
              <div className="overflow-x-auto mb-6">
                <p className="text-xs text-gray-500 mb-3">
                  Same SIP: {formatINR(sipAmount)}/month for {sipYears} years
                </p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/50">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Metric</th>
                      {comparisonData.map((d, idx) => (
                        <th key={d.fundId} className="text-right py-3 px-4 font-medium text-gray-900 min-w-[140px]">
                          <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: COMPARE_COLORS[idx] }} />
                          {d.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 font-medium text-gray-600">Expected Return</td>
                      {comparisonData.map((d) => (
                        <td key={d.fundId} className="py-3 px-4 text-right font-medium text-gray-900">{d.rate.toFixed(1)}%</td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 font-medium text-gray-600">Total Invested</td>
                      {comparisonData.map((d) => (
                        <td key={d.fundId} className="py-3 px-4 text-right text-gray-700">{formatINR(d.totalInvested)}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 font-medium text-gray-600">Expected Corpus</td>
                      {comparisonData.map((d) => (
                        <td key={d.fundId} className="py-3 px-4 text-right font-bold text-indigo-700">{formatINR(d.futureValue)}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 font-medium text-gray-600">Est. Gains</td>
                      {comparisonData.map((d) => (
                        <td key={d.fundId} className="py-3 px-4 text-right font-bold text-green-700">{formatINR(d.gains)}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Grouped Bar Chart */}
            {barChartData && barChartData.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-500 mb-3 font-medium">Expected Corpus Comparison</p>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => formatINRShort(v)}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || payload.length === 0) return null;
                        const d = payload[0]?.payload;
                        return (
                          <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg text-sm">
                            <p className="font-medium text-gray-800 mb-1">{d?.name}</p>
                            <p className="text-indigo-600">Corpus: <span className="font-semibold">{formatINR(d?.corpus || 0)}</span></p>
                            <p className="text-gray-600">Invested: {formatINR(d?.invested || 0)}</p>
                            <p className="text-green-600">Gains: {formatINR(d?.gains || 0)}</p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="corpus" radius={[6, 6, 0, 0]} maxBarSize={60}>
                      {barChartData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}

        {compareFundIds.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">Add funds above to compare their SIP outcomes</p>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
