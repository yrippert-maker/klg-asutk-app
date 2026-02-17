'use client';
import { useMemo } from 'react';
import { Modal } from '@/components/ui';

interface DocItem {
  name: string;
  ref?: string;
  articles?: string;
  content?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  doc: DocItem | null;
}

/** Простой рендер markdown-подобных заголовков и параграфов для оглавления */
function getHeadings(content: string): { id: string; text: string; level: number }[] {
  const headings: { id: string; text: string; level: number }[] = [];
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    const m = line.match(/^(#{1,3})\s+(.+)$/);
    if (m) headings.push({ id: `h-${i}`, text: m[2], level: m[1].length });
  });
  return headings;
}

function renderContent(content: string) {
  const lines = content.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('### ')) return <h3 key={i} id={`h-${i}`} className="text-sm font-bold mt-4 mb-2 text-gray-800">{line.slice(4)}</h3>;
    if (line.startsWith('## ')) return <h2 key={i} id={`h-${i}`} className="text-base font-bold mt-6 mb-2 text-gray-900">{line.slice(3)}</h2>;
    if (line.startsWith('# ')) return <h1 key={i} id={`h-${i}`} className="text-lg font-bold mt-2 mb-3 text-gray-900">{line.slice(2)}</h1>;
    if (line.trim() === '') return <br key={i} />;
    return <p key={i} className="text-sm text-gray-700 mb-2">{line}</p>;
  });
}

export default function HelpDocumentModal({ isOpen, onClose, doc }: Props) {
  const content = doc?.content || (doc ? `${doc.name}\n\n${doc.ref || ''}\n\n${doc.articles || ''}` : '');
  const headings = useMemo(() => getHeadings(content), [content]);

  const handleDownload = () => {
    if (!doc) return;
    const text = [doc.name, doc.ref || '', doc.articles || '', '', content].filter(Boolean).join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${doc.name.replace(/\s+/g, '_')}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  if (!doc) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={doc.name}
      size="lg"
      footer={
        <div className="flex gap-2">
          <button onClick={handleDownload} className="btn-primary">Скачать PDF</button>
          <button onClick={onClose} className="btn-secondary">Закрыть</button>
        </div>
      }
    >
      <div className="flex gap-6">
        {headings.length > 0 && (
          <nav className="w-48 shrink-0 border-r border-gray-200 pr-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Оглавление</h4>
            <ul className="space-y-1 text-xs">
              {headings.map((h, i) => (
                <li key={i} style={{ paddingLeft: (h.level - 1) * 8 }}>
                  <a href={`#${h.id}`} className="text-blue-600 hover:underline" onClick={e => { e.preventDefault(); document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' }); }}>
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <div className="flex-1 min-w-0 prose prose-sm max-w-none overflow-y-auto max-h-[60vh]">
          {doc.ref && <p className="text-xs text-gray-500 mb-2">{doc.ref}</p>}
          {doc.articles && <p className="text-xs text-blue-600 mb-4">{doc.articles}</p>}
          {renderContent(content)}
        </div>
      </div>
    </Modal>
  );
}
