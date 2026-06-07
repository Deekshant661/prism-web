interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export default function Spinner({ size = 'md' }: SpinnerProps) {
  return (
    <div className="flex items-center justify-center py-12">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600`}
      />
    </div>
  );
}
