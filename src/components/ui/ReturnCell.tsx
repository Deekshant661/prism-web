import { formatReturn } from '../../utils/format';

interface ReturnCellProps {
  value: number | null;
}

export default function ReturnCell({ value }: ReturnCellProps) {
  if (value === null || value === undefined) {
    return <span className="text-gray-400">—</span>;
  }

  let colorClass = 'text-gray-600';
  if (value > 0) colorClass = 'text-green-600 font-medium';
  if (value < 0) colorClass = 'text-red-500 font-medium';

  return <span className={colorClass}>{formatReturn(value)}</span>;
}
