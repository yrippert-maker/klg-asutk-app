'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Logo from '@/components/Logo';

export default function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isAuthenticated) { router.push('/dashboard'); return null; }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSubmitting(true);
    try { await login(token || 'dev'); router.push('/dashboard'); }
    catch { setError('Неверный токен или сервер недоступен'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-12 rounded-xl shadow-lg max-w-md w-full">
        <div className="text-center mb-8">
          <Logo size="large" />
          <h1 className="text-2xl font-bold text-primary-500 mt-4">КЛГ АСУ ТК</h1>
          <p className="text-sm text-gray-400 mt-2">Контроль лётной годности · Вход</p>
        </div>
        <form onSubmit={handleLogin}>
          <label className="block text-sm font-bold text-gray-600 mb-1">Токен доступа</label>
          <input type="password" value={token} onChange={e => setToken(e.target.value)}
            placeholder="Введите токен или оставьте пустым для dev"
            className="input-field mb-4" />
          {error && <div className="bg-red-50 p-3 rounded text-red-700 text-sm mb-4">{error}</div>}
          <button type="submit" disabled={submitting}
            className="w-full py-3 bg-primary-500 text-white rounded-md text-lg font-bold hover:bg-primary-600 transition-colors disabled:opacity-60 border-none cursor-pointer">
            {submitting ? 'Вход...' : 'Войти'}
          </button>
        </form>
        <div className="text-center mt-6 text-xs text-gray-300">АО «REFLY» · {new Date().getFullYear()}</div>
      </div>
    </div>
  );
}
