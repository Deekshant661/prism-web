import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatINR, formatINRShort } from '../../utils/format';

interface SIPCalculatorProps {
  fundName?: string;
  defaultRate?: number;
  rateSource?: string; // e.g. "5Y CAGR"
}

function calculateSIP(monthly: number, annualRate: number, years: number) {
  const r = annualRate / 12 / 100;
  const n = years * 12;
  if (r === 0) return { futureValue: monthly * n, totalInvested: monthly * n, gains: 0 };
  const futureValue = monthly * (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
  const totalInvested = monthly * n;
  return { futureValue, totalInvested, gains: futureValue - totalInvested };
}

export default function SIPCalculator({ fundName, defaultRate = 12, rateSource }: SIPCalculatorProps) {
  const [monthlyAmount, setMonthlyAmount] = useState(5000);
  const [years, setYears] = useState(10);
  const [annualRate, setAnnualRate] = useState(defaultRate);

  const { futureValue, totalInvested, gains } = useMemo(
    () => calculateSIP(monthlyAmount, annualRate, years),
    [monthlyAmount, annualRate, years]
  );

  // Build year-by-year data for chart
  const chartData = useMemo(() => {
    const data = [];
    for (let y = 0; y <= years; y++) {
      const inv = monthlyAmount * 12 * y;
      const { futureValue: fv } = calculateSIP(monthlyAmount, annualRate, y);
      data.push({
        year: y === 0 ? 'Start' : `${y}Y`,
        invested: Math.round(inv),
        value: Math.round(fv),
        gains: Math.round(fv - inv),
      });
    }
    return data;
  }, [monthlyAmount, annualRate, years]);

  return (
    <div>
      {/* Header */}
      {fundName && (
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-900">
            SIP Calculator — {fundName}
          </h3>
          {rateSource && (
            <p className="text-xs text-gray-500 mt-0.5">
              Using {rateSource}: {annualRate.toFixed(1)}% (you can edit this)
            </p>
          )}
        </div>
      )}

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase mb-1.5">
            Monthly SIP Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
            <input
              type="number"
              value={monthlyAmount}
              onChange={(e) => setMonthlyAmount(Math.max(500, Number(e.target.value)))}
              min={500}
              step={500}
              className="w-full pl-7 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
          <input
            type="range"
            min={500}
            max={100000}
            step={500}
            value={monthlyAmount}
            onChange={(e) => setMonthlyAmount(Number(e.target.value))}
            className="w-full mt-2 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase mb-1.5">
            Investment Period
          </label>
          <div className="relative">
            <input
              type="number"
              value={years}
              onChange={(e) => setYears(Math.max(1, Math.min(40, Number(e.target.value))))}
              min={1}
              max={40}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Years</span>
          </div>
          <input
            type="range"
            min={1}
            max={40}
            step={1}
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full mt-2 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase mb-1.5">
            Expected Return
          </label>
          <div className="relative">
            <input
              type="number"
              value={annualRate}
              onChange={(e) => setAnnualRate(Math.max(1, Math.min(50, Number(e.target.value))))}
              min={1}
              max={50}
              step={0.1}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">% p.a.</span>
          </div>
          <input
            type="range"
            min={1}
            max={50}
            step={0.5}
            value={annualRate}
            onChange={(e) => setAnnualRate(Number(e.target.value))}
            className="w-full mt-2 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>
      </div>

      {/* Output Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
          <p className="text-xs text-gray-500 uppercase font-medium mb-1">Total Invested</p>
          <p className="text-lg font-bold text-gray-900">{formatINR(totalInvested)}</p>
        </div>
        <div className="bg-indigo-50 rounded-xl p-4 text-center border border-indigo-100">
          <p className="text-xs text-indigo-600 uppercase font-medium mb-1">Expected Value</p>
          <p className="text-lg font-bold text-indigo-700">{formatINR(futureValue)}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
          <p className="text-xs text-green-600 uppercase font-medium mb-1">Est. Returns</p>
          <p className="text-lg font-bold text-green-700">{formatINR(gains)}</p>
        </div>
      </div>

      {/* Growth Chart */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="sipInvestedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="sipGainsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
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
              content={({ active, payload, label }) => {
                if (!active || !payload || payload.length === 0) return null;
                const inv = payload.find((p) => p.dataKey === 'invested')?.value as number;
                const val = payload.find((p) => p.dataKey === 'value')?.value as number;
                const g = payload.find((p) => p.dataKey === 'gains')?.value as number;
                return (
                  <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg text-sm">
                    <p className="font-medium text-gray-800 mb-1">Year {label}</p>
                    <p className="text-gray-600">Invested: <span className="font-semibold text-gray-900">{formatINR(inv || 0)}</span></p>
                    <p className="text-indigo-600">Value: <span className="font-semibold">{formatINR(val || 0)}</span></p>
                    <p className="text-green-600">Gains: <span className="font-semibold">{formatINR(g || 0)}</span></p>
                  </div>
                );
              }}
            />
            <Legend
              formatter={(value: string) => (
                <span className="text-xs text-gray-600">{value === 'invested' ? 'Invested' : value === 'value' ? 'Total Value' : 'Gains'}</span>
              )}
            />
            <Area
              type="monotone"
              dataKey="invested"
              stackId="1"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#sipInvestedGrad)"
              name="invested"
            />
            <Area
              type="monotone"
              dataKey="gains"
              stackId="1"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#sipGainsGrad)"
              name="gains"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export { calculateSIP };
