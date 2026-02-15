'use client';

import { useRef, useState } from 'react';
import { documentTemplatesApi } from '@/lib/api/api-client';
import { useAuth } from '@/lib/auth-context';

interface Props {
  template: { id: string; name: string; code: string; html_content: string };
  onClose: () => void;
  onSaved?: () => void;
}

export default function DocumentPreviewModal({ template, onClose, onSaved }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const { hasRole } = useAuth();
  const canEdit = hasRole('admin') || hasRole('authority_inspector');

  const handlePrint = () => {
    window.print();
  };

  const handleSave = async () => {
    if (!contentRef.current || !canEdit) return;
    setSaving(true);
    try {
      const html = contentRef.current.innerHTML;
      await documentTemplatesApi.update(template.id, { html_content: html });
      onSaved?.();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .document-preview-modal-print, .document-preview-modal-print * { visibility: visible; }
          .document-preview-modal-print { position: absolute; left: 0; top: 0; width: 100%; background: white; }
          .document-preview-modal-print .document-print-header { display: none; }
        }
      `}</style>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 document-preview-modal-print" onClick={onClose}>
      <div
        className="flex max-h-[95vh] w-full max-w-5xl flex-col rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="document-print-header flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div>
            <span className="font-bold text-gray-800">{template.name}</span>
            <span className="ml-2 text-sm text-gray-500">{template.code}</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="rounded bg-primary-500 px-3 py-1.5 text-sm text-white hover:bg-primary-600"
            >
              🖨️ Печать
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Сохранение…' : '💾 Сохранить изменения'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded bg-gray-200 px-3 py-1.5 text-sm hover:bg-gray-300"
            >
              Закрыть
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 print:overflow-visible">
          <div
            ref={contentRef}
            className="document-content mx-auto max-w-[210mm]"
            dangerouslySetInnerHTML={{ __html: template.html_content }}
          />
        </div>
      </div>
    </div>
    </>
  );
}
