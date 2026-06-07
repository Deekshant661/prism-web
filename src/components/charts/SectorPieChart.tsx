import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { SectorAllocation } from '../../types/fund';

interface SectorPieChartProps {
  data: SectorAllocation[];
}

const COLORS = [
  '#6366f1', '#8b5cf6', '#a78bfa', '#c084fc',
  '#06b6d4', '#14b8a6', '#10b981', '#22c55e',
  '#eab308', '#f59e0b', '#f97316', '#ef4444',
];

const SectorPieChart = React.memo(function SectorPieChart({ data }: SectorPieChartProps) {
  if (data.length === 0) return null;

  const chartData = data.map((s) => ({
    name: s.sector_name,
    value: s.allocation_pct,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
        >
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '13px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
          }}
          formatter={(value: unknown) => [`${Number(value).toFixed(1)}%`, 'Allocation']}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: '12px' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
});

export default SectorPieChart;
