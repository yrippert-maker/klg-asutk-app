'use client';

interface Props {
  label: string;
  value: string | number;
  border?: string;
  icon?: string;
  onClick?: () => void;
}

export default function StatCard({ label, value, border = 'border-l-primary-500', icon, onClick }: Props) {
  return (
    <div onClick={onClick} className={`card p-5 border-l-4 ${border} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}>
      <div className="text-xs text-gray-500 mb-1">{icon && <span className="mr-1">{icon}</span>}{label}</div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
    </div>
  );
}
