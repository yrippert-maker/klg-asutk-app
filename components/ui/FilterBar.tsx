'use client';

interface FilterOption {
  value: string | undefined;
  label: string;
  color?: string;
}

interface Props {
  options: FilterOption[];
  value: string | undefined;
  onChange: (v: string | undefined) => void;
  className?: string;
}

export default function FilterBar({ options, value, onChange, className = '' }: Props) {
  return (
    <div className={`flex gap-2 flex-wrap ${className}`}>
      {options.map(o => (
        <button key={o.value ?? '__all'} onClick={() => onChange(o.value)}
          className={`filter-btn ${value === o.value
            ? (o.color ? `${o.color} text-white` : 'filter-btn-active')
            : 'filter-btn-inactive'}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
