'use client';

interface Props {
  message: string;
  icon?: string;
  variant?: 'info' | 'success' | 'warning';
}

const variants = { info: 'bg-blue-50', success: 'bg-green-50', warning: 'bg-orange-50' };
const icons = { info: 'ℹ️', success: '✅', warning: '⚠️' };

export default function EmptyState({ message, icon, variant = 'info' }: Props) {
  return (
    <div className={`card p-5 ${variants[variant]} flex items-center gap-3`}>
      <span className="text-xl">{icon || icons[variant]}</span>
      <span className="text-sm">{message}</span>
    </div>
  );
}
