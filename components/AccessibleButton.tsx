/**
 * Доступная кнопка с поддержкой ARIA и клавиатуры
 */
'use client';

import { ReactNode, KeyboardEvent } from 'react';
import { getButtonAriaProps } from '@/lib/accessibility/aria';
import { createActivationHandler } from '@/lib/accessibility/keyboard';

interface AccessibleButtonProps {
  children: ReactNode;
  onClick: () => void;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  disabled?: boolean;
  pressed?: boolean;
  expanded?: boolean;
  controls?: string;
  className?: string;
  style?: React.CSSProperties;
  type?: 'button' | 'submit' | 'reset';
}

export default function AccessibleButton({
  children,
  onClick,
  ariaLabel,
  ariaDescribedBy,
  disabled = false,
  pressed,
  expanded,
  controls,
  className,
  style,
  type = 'button',
}: AccessibleButtonProps) {
  const ariaProps = getButtonAriaProps({
    label: ariaLabel,
    describedBy: ariaDescribedBy,
    pressed,
    expanded,
    controls,
    disabled,
  });

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const handler = createActivationHandler(() => {
      if (!disabled) {
        onClick();
      }
    });
    handler(event.nativeEvent);
  };

  return (
    <button
      type={type}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      className={className}
      style={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
      {...ariaProps}
    >
      {children}
    </button>
  );
}
