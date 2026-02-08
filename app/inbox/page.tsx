'use client';


import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Logo from '@/components/Logo';

const INBOX_API = '/api/inbox';

export default function InboxPage() {
  const [files, setFiles] = useState<Array<{ id: string; original_name: string; originalName?: string; size: number; created_at: string; createdAt?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/inbox/files');
      if (!res.ok) throw new Error('Ошибка загрузки');
      const data = await res.json();
      setFiles(data.map((f: { id: string; original_name: string; originalName?: string; size: number; created_at: string; createdAt?: string }) => ({
        id: f.id,
        original_name: f.original_name || f.originalName,
        size: f.size,
        created_at: f.created_at || f.createdAt,
      })));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div id="main-content" role="main" style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ marginBottom: '32px' }}>
          <Logo size="large" />
          <p style={{ fontSize: '16px', color: '#666', marginTop: '16px', marginBottom: '24px' }}>
            Inbox — загрузка и обработка документов
          </p>
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>AI Inbox</h2>
        <p style={{ color: '#666', marginBottom: '24px' }}>
          Загрузите PDF или DOCX для извлечения данных. API: FastAPI /api/v1/inbox или Express inbox-server.
        </p>
        <button
          onClick={loadFiles}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#1e3a5f',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Загрузка...' : 'Обновить список файлов'}
        </button>
        {error && <div style={{ color: 'red', marginTop: '16px' }}>{error}</div>}
        {files.length > 0 && (
          <ul style={{ marginTop: '24px', listStyle: 'none', padding: 0 }}>
            {files.map((f) => (
              <li key={f.id} style={{ padding: '12px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                <span>{f.original_name}</span>
                <span style={{ color: '#666' }}>{(f.size / 1024).toFixed(1)} KB</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
