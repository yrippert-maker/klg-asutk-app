'use client';

interface Props {
  error: Error | string | null;
  onRetry?: () => void;
  variant?: 'inline' | 'page' | 'toast';
}

export default function ErrorDisplay({ error, onRetry, variant = 'inline' }: Props) {
  if (!error) return null;
  const message = typeof error === 'string' ? error : error.message;

  if (variant === 'toast') {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in">
        <span className="text-sm">{message}</span>
        {onRetry && <button onClick={onRetry} className="text-white/80 hover:text-white underline text-sm">Повторить</button>}
      </div>
    );
  }

  if (variant === 'page') {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-600 mb-2">Произошла ошибка</h2>
          <p className="text-gray-500 mb-6">{message}</p>
          {onRetry && <button onClick={onRetry} className="btn-primary">Попробовать снова</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
      <span className="text-red-500 text-lg shrink-0">⚠️</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-red-700 font-medium">Ошибка</div>
        <div className="text-sm text-red-600 mt-1">{message}</div>
      </div>
      {onRetry && <button onClick={onRetry} className="btn-sm bg-red-100 text-red-600 hover:bg-red-200 shrink-0">↻</button>}
    </div>
  );
}
