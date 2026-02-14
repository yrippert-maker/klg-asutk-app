/**
 * App providers — Auth, I18n, dark mode initialization.
 * Разработчик: АО «REFLY»
 */
'use client';
import { ReactNode, useEffect } from 'react';
import { AuthProvider } from '@/lib/auth-context';
import { I18nProvider } from '@/hooks/useI18n';

function DarkModeInit() {
  useEffect(() => {
    // Apply saved theme on mount
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('klg-theme') : null;
    const dark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
  }, []);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <AuthProvider>
        <DarkModeInit />
        {children}
      </AuthProvider>
    </I18nProvider>
  );
}
