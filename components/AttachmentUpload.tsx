/**
 * Универсальный компонент загрузки файлов.
 * Используется для нарядов на ТО, дефектов, чек-листов.
 */
'use client';
import { useState, useRef } from 'react';

interface Props {
  ownerKind: string;  // 'work_order' | 'defect' | 'checklist' | 'aircraft'
  ownerId: string;
  onUploaded?: (att: any) => void;
}

export default function AttachmentUpload({ ownerKind, ownerId, onUploaded }: Props) {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/v1/attachments/${ownerKind}/${ownerId}`, { method: 'POST', body: fd });
      const att = await res.json();
      if (att.id) {
        setFiles(prev => [...prev, att]);
        onUploaded?.(att);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button onClick={() => inputRef.current?.click()} disabled={uploading}
          className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded transition-colors disabled:opacity-50">
          {uploading ? '⏳ Загрузка...' : '📎 Прикрепить файл'}
        </button>
        <input ref={inputRef} type="file" className="hidden" onChange={handleUpload}
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" />
      </div>
      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((f: any) => (
            <div key={f.id} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
              <span>📄</span>
              <span className="truncate">{f.filename || f.file_name}</span>
              <a href={`/api/v1/attachments/${f.id}/download`} className="text-blue-500 hover:underline ml-auto">⬇</a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
