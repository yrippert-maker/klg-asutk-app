'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OIDCCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // The useOIDCAuth hook in providers.tsx handles the code exchange.
    // This page just shows a loading state while that happens.
    const timeout = setTimeout(() => router.push('/dashboard'), 3000);
    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="text-4xl mb-4">🔐</div>
        <h2 className="text-lg font-bold text-primary-500 mb-2">Авторизация...</h2>
        <p className="text-sm text-gray-500">Выполняется вход в систему</p>
      </div>
    </div>
  );
}
