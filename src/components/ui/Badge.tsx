import type { FundCategory } from '../../types/fund';
import { categoryLabel } from '../../utils/format';

const categoryColors: Record<string, string> = {
  LARGE_CAP: 'bg-blue-100 text-blue-700',
  MID_CAP: 'bg-violet-100 text-violet-700',
  SMALL_CAP: 'bg-orange-100 text-orange-700',
  FLEXI_CAP: 'bg-teal-100 text-teal-700',
  ELSS: 'bg-green-100 text-green-700',
  INDEX: 'bg-gray-100 text-gray-700',
  DEBT: 'bg-yellow-100 text-yellow-700',
  BALANCED_ADVANTAGE: 'bg-emerald-100 text-emerald-700',
  FULL: 'bg-emerald-100 text-emerald-700',
  PARTIAL: 'bg-amber-100 text-amber-700',
  INSUFFICIENT: 'bg-red-100 text-red-700',
};

interface BadgeProps {
  category: FundCategory | string;
  label?: string;
}

export default function Badge({ category, label }: BadgeProps) {
  const colorClasses = categoryColors[category] || 'bg-gray-100 text-gray-700';

  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${colorClasses}`}
    >
      {label || categoryLabel(category)}
    </span>
  );
}
