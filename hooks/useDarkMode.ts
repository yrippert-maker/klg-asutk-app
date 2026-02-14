/**
 * Dark mode hook — persists preference, syncs with system.
 * Разработчик: АО «REFLY»
 */
'use client';
import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function useDarkMode() {
  const [theme, setThemeState] = useState<Theme>('system');
  const [isDark, setIsDark] = useState(false);

  const applyTheme = useCallback((t: Theme) => {
    const dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  useEffect(() => {
    const saved = (typeof localStorage !== 'undefined' && localStorage.getItem('klg-theme') as Theme) || 'system';
    setThemeState(saved);
    applyTheme(saved);

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => { if (theme === 'system') applyTheme('system'); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [applyTheme, theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    if (typeof localStorage !== 'undefined') localStorage.setItem('klg-theme', t);
    applyTheme(t);
  };

  const toggle = () => setTheme(isDark ? 'light' : 'dark');

  return { theme, isDark, setTheme, toggle };
}
