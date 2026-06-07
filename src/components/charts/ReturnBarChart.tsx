import React from 'react';
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

interface ReturnBarChartProps {
  data: { label: string; value: number | null }[];
}

const ReturnBarChart = React.memo(function ReturnBarChart({ data }: ReturnBarChartProps) {
  const chartData = data
    .filter((d) => d.value !== null)
    .map((d) => ({
      name: d.label,
      return: d.value as number,
    }));

  if (chartData.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: '#6b7280' }}
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `${v}%`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '13px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
          }}
          formatter={(value: unknown) => [`${Number(value).toFixed(1)}%`, 'Return']}
        />
        <Bar dataKey="return" radius={[4, 4, 0, 0]} maxBarSize={48}>
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.return >= 0 ? '#22c55e' : '#ef4444'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
});

export default ReturnBarChart;
