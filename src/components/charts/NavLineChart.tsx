import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { NavPoint } from '../../types/nav';
import { formatNavDate } from '../../utils/format';

interface NavLineChartProps {
  data: NavPoint[];
  isPositive?: boolean;
  startNav?: number;
  categoryAvgData?: { nav_date: string; nav_value: number }[];
  showCategoryAvg?: boolean;
}

const NavLineChart = React.memo(function NavLineChart({
  data,
  isPositive = true,
  startNav,
  categoryAvgData,
  showCategoryAvg,
}: NavLineChartProps) {
  const chartData = useMemo(() => {
    const baseNav = startNav ?? (data.length > 0 ? data[0].nav_value : 1);
    return data.map((d) => {
      const changePct = baseNav > 0 ? ((d.nav_value - baseNav) / baseNav) * 100 : 0;
      // Find matching category avg if available
      let categoryAvg: number | undefined;
      if (showCategoryAvg && categoryAvgData) {
        const match = categoryAvgData.find((c) => c.nav_date === d.nav_date);
        if (match) categoryAvg = match.nav_value;
      }
      return {
        date: d.nav_date,
        nav: d.nav_value,
        changePct,
        label: formatNavDate(d.nav_date),
        categoryAvg,
      };
    });
  }, [data, startNav, categoryAvgData, showCategoryAvg]);

  if (chartData.length === 0) return null;

  const gradientId = isPositive ? 'navGradientGreen' : 'navGradientRed';
  const strokeColor = isPositive ? '#059669' : '#dc2626';
  const stopColorStart = isPositive ? '#10b981' : '#ef4444';
  const stopColorEnd = isPositive ? '#10b981' : '#ef4444';

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={stopColorStart} stopOpacity={0.15} />
            <stop offset="95%" stopColor={stopColorEnd} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `₹${v.toFixed(0)}`}
          domain={['auto', 'auto']}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload || payload.length === 0) return null;
            const nav = payload[0]?.value as number;
            const changePct = payload[0]?.payload?.changePct as number | undefined;
            const catAvg = payload[0]?.payload?.categoryAvg as number | undefined;
            return (
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg text-sm">
                <p className="font-medium text-gray-800 mb-1">{label}</p>
                <p className="text-gray-700">NAV: <span className="font-semibold">₹{nav?.toFixed(2)}</span></p>
                {changePct !== undefined && (
                  <p className={`text-xs font-medium ${changePct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Change from start: {changePct >= 0 ? '+' : ''}{changePct.toFixed(1)}%
                  </p>
                )}
                {catAvg !== undefined && (
                  <p className="text-xs text-gray-500">Category Avg: ₹{catAvg.toFixed(2)}</p>
                )}
              </div>
            );
          }}
        />
        {/* Starting NAV reference line */}
        {startNav && (
          <ReferenceLine
            y={startNav}
            stroke="#9ca3af"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
        )}
        <Area
          type="monotone"
          dataKey="nav"
          stroke={strokeColor}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 4, fill: strokeColor }}
        />
        {showCategoryAvg && (
          <Area
            type="monotone"
            dataKey="categoryAvg"
            stroke="#9ca3af"
            strokeWidth={1.5}
            strokeDasharray="5 3"
            fill="none"
            dot={false}
            activeDot={false}
            connectNulls
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
});

export default NavLineChart;
