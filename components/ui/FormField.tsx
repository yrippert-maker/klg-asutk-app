'use client';

interface Props {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}

export default function FormField({ label, children, required }: Props) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-bold text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
