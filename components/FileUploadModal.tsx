'use client';
import { useState, useRef } from 'react';
import { Modal } from '@/components/ui';

interface Props { isOpen: boolean; onClose: () => void; onUpload?: (file: File) => void; }

export default function FileUploadModal({ isOpen, onClose, onUpload }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => { setFile(f); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); };

  const handleSubmit = () => { if (file && onUpload) { onUpload(file); setFile(null); onClose(); } };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Загрузка файла" size="md"
      footer={<><button onClick={onClose} className="btn-secondary">Отмена</button><button onClick={handleSubmit} disabled={!file} className="btn-primary disabled:opacity-50">Загрузить</button></>}>
      <div onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
        className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors
          ${dragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'}`}
        onClick={() => inputRef.current?.click()}>
        <input ref={inputRef} type="file" accept=".pdf,.docx,.doc,.xlsx,.csv,.zip" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} className="hidden" />
        {file ? (
          <div><div className="text-4xl mb-2">📄</div><div className="font-bold">{file.name}</div><div className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} МБ</div></div>
        ) : (
          <div><div className="text-4xl mb-2">📤</div><div className="font-bold text-gray-600">Перетащите файл или нажмите</div><div className="text-sm text-gray-400 mt-1">PDF, DOCX, XLSX, CSV, ZIP</div></div>
        )}
      </div>
    </Modal>
  );
}
