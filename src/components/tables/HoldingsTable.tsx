import type { Holding } from '../../types/fund';
import { formatPercent } from '../../utils/format';

interface HoldingsTableProps {
  holdings: Holding[];
  limit?: number;
}

export default function HoldingsTable({ holdings, limit = 10 }: HoldingsTableProps) {
  const displayed = holdings
    .sort((a, b) => b.allocation_pct - a.allocation_pct)
    .slice(0, limit);

  return (
    <div className="overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2.5 font-medium text-gray-500">#</th>
            <th className="text-left py-2.5 font-medium text-gray-500">Company</th>
            <th className="text-right py-2.5 font-medium text-gray-500">Allocation</th>
          </tr>
        </thead>
        <tbody>
          {displayed.map((holding, idx) => (
            <tr key={`${holding.company_name}-${idx}`} className="border-b border-gray-50">
              <td className="py-2.5 text-gray-400">{idx + 1}</td>
              <td className="py-2.5 text-gray-900 font-medium">{holding.company_name}</td>
              <td className="py-2.5 text-right text-gray-600">
                <div className="flex items-center justify-end gap-2">
                  <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-400"
                      style={{ width: `${Math.min(holding.allocation_pct * 5, 100)}%` }}
                    />
                  </div>
                  <span className="w-12 text-right">{formatPercent(holding.allocation_pct)}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
