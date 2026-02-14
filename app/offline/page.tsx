'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center max-w-md p-8">
        <div className="text-6xl mb-4">✈️</div>
        <h1 className="text-2xl font-bold text-primary-500 mb-2">Нет подключения</h1>
        <p className="text-gray-500 mb-6">Проверьте интернет-соединение и попробуйте снова.</p>
        <button onClick={() => window.location.reload()} className="btn-primary">Обновить</button>
      </div>
    </div>
  );
}
