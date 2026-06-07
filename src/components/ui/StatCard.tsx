interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  valueColor?: string;
}

export default function StatCard({ label, value, subtitle, valueColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-xl font-bold mt-1 ${valueColor || 'text-gray-900'}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}
