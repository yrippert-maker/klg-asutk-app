/**
 * Провайдеры для приложения
 * Включает Error Boundary и другие глобальные провайдеры
 */
'use client';

import { ReactNode } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import SkipToMain from '@/components/SkipToMain';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      <SkipToMain />
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </>
  );
}
