'use client';

interface Props {
  status: string;
  colorMap?: Record<string, string>;
  labelMap?: Record<string, string>;
}

const defaults: Record<string, string> = {
  active: 'bg-green-500', valid: 'bg-green-500', completed: 'bg-green-500', approved: 'bg-green-500',
  in_progress: 'bg-blue-500', submitted: 'bg-blue-500',
  draft: 'bg-gray-400', planned: 'bg-purple-500', pending: 'bg-gray-400',
  critical: 'bg-red-600', high: 'bg-orange-500', medium: 'bg-yellow-500', low: 'bg-green-500',
  rejected: 'bg-red-700', expired: 'bg-red-500', suspended: 'bg-orange-500',
  under_review: 'bg-orange-500', remarks: 'bg-red-500',
  maintenance: 'bg-orange-500', storage: 'bg-gray-400', inactive: 'bg-red-500',
  overdue: 'bg-red-600', deferred: 'bg-yellow-600',
};

export default function StatusBadge({ status, colorMap, labelMap }: Props) {
  const color = colorMap?.[status] || defaults[status] || 'bg-gray-400';
  const label = labelMap?.[status] || status;
  return <span className={`status-badge ${color}`}>{label}</span>;
}
