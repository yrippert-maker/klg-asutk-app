/**
 * Компонент "Skip to main content" для screen readers
 */
'use client';

export default function SkipToMain() {
  return (
    <a
      href="#main-content"
      className="skip-to-main"
      aria-label="Перейти к основному содержимому"
    >
      Перейти к основному содержимому
    </a>
  );
}
