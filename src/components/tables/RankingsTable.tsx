import { useNavigate } from 'react-router-dom';
import type { RankedFund } from '../../types/ranking';
import ReturnCell from '../ui/ReturnCell';
import Badge from '../ui/Badge';
import { formatScore, formatExpenseRatio } from '../../utils/format';

interface RankingsTableProps {
  funds: RankedFund[];
}

export default function RankingsTable({ funds }: RankingsTableProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/50">
              <th className="text-left py-3 px-4 font-medium text-gray-500 w-12">#</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500 min-w-[220px]">Fund</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Category</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">1Y</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">3Y CAGR</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">5Y CAGR</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500 min-w-[120px]">Score</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">Expense</th>
            </tr>
          </thead>
          <tbody>
            {funds.map((fund) => (
              <tr
                key={fund.fund_id}
                onClick={() => navigate(`/fund/${fund.fund_id}`)}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <td className="py-3 px-4 text-gray-500 font-medium">{fund.rank}</td>
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium text-gray-900 truncate max-w-[240px]">{fund.fund_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{fund.amc}</p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <Badge category={fund.category || ''} />
                    {fund.data_sufficiency === 'PARTIAL' && (
                      <Badge category="PARTIAL" label="Partial" />
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <ReturnCell value={fund.one_year_return} />
                </td>
                <td className="py-3 px-4 text-right">
                  <ReturnCell value={fund.three_year_cagr} />
                </td>
                <td className="py-3 px-4 text-right">
                  <ReturnCell value={fund.five_year_cagr} />
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-bold text-gray-900">{formatScore(fund.composite_score)}</span>
                    <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all"
                        style={{ width: `${Math.min(fund.composite_score || 0, 100)}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-right text-gray-600">
                  {formatExpenseRatio(fund.expense_ratio)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
