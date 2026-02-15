/**
 * Обёртка для Lucide и REFLY иконок — единый stroke (1.75) и размер через className.
 */
import type { LucideIcon } from 'lucide-react';
import type { ReflyIconProps } from '@/icons/refly-icons';

export type AnyIcon = LucideIcon | React.FC<ReflyIconProps>;

interface IconProps {
  icon: AnyIcon;
  className?: string;
  strokeWidth?: number;
  size?: number;
}

export function Icon({ icon: IconCmp, className, strokeWidth = 1.75, size }: IconProps) {
  return (
    <IconCmp
      className={className}
      strokeWidth={strokeWidth}
      {...(size !== undefined && { size })}
    />
  );
}
