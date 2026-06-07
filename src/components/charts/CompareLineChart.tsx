import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { NavPoint } from '../../types/nav';
import { formatNavDate } from '../../utils/format';

interface FundNavData {
  fundName: string;
  data: NavPoint[];
}

interface CompareLineChartProps {
  fundsData: FundNavData[];
}

const LINE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444'];

const CompareLineChart = React.memo(function CompareLineChart({
  fundsData,
}: CompareLineChartProps) {
  const chartData = useMemo(() => {
    // Build a unified dataset keyed by date
    const dateMap = new Map<string, Record<string, number>>();

    fundsData.forEach((fund, idx) => {
      // Normalize to base 100 for fair comparison
      const base = fund.data[0]?.nav_value || 1;
      fund.data.forEach((point) => {
        if (!dateMap.has(point.nav_date)) {
          dateMap.set(point.nav_date, { date: point.nav_date as unknown as number });
        }
        const row = dateMap.get(point.nav_date)!;
        row[`fund_${idx}`] = (point.nav_value / base) * 100;
      });
    });

    return Array.from(dateMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [fundsData]);

  if (chartData.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
          tickFormatter={(v: string) => formatNavDate(v)}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          domain={['auto', 'auto']}
          tickFormatter={(v: number) => `${v.toFixed(0)}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '13px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
          }}
          labelFormatter={(label: unknown) => formatNavDate(String(label))}
          formatter={(value: unknown, name: unknown) => {
            const idx = parseInt(String(name).replace('fund_', ''));
            const fundName = fundsData[idx]?.fundName || String(name);
            return [`${Number(value).toFixed(1)}`, fundName];
          }}
        />
        <Legend
          formatter={(value: string) => {
            const idx = parseInt(value.replace('fund_', ''));
            return fundsData[idx]?.fundName || value;
          }}
          iconType="line"
          wrapperStyle={{ fontSize: '12px' }}
        />
        {fundsData.map((_, idx) => (
          <Line
            key={`fund_${idx}`}
            type="monotone"
            dataKey={`fund_${idx}`}
            stroke={LINE_COLORS[idx % LINE_COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
});

export default CompareLineChart;
