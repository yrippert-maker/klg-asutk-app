'use client';

import { useState } from 'react';
import { PageLayout, FilterBar, EmptyState } from '@/components/ui';
import { documentTemplatesApi } from '@/lib/api/api-client';
import useSWR from 'swr';
import DocumentPreviewModal from '@/components/DocumentPreviewModal';

const CATEGORIES = [
  { value: undefined, label: 'Все' },
  { value: 'application', label: '📝 Заявки' },
  { value: 'certificate', label: '📜 Сертификаты' },
  { value: 'act', label: '📋 Акты' },
  { value: 'letter', label: '✉️ Письма' },
  { value: 'form', label: '📄 Формы' },
  { value: 'report', label: '📊 Отчёты' },
  { value: 'order', label: '📌 Приказы' },
];

const STANDARDS = [
  { value: undefined, label: 'Все' },
  { value: 'RF', label: '🇷🇺 РФ' },
  { value: 'ICAO', label: '🌐 ИКАО' },
  { value: 'EASA', label: '🇪🇺 EASA' },
  { value: 'FAA', label: '🇺🇸 FAA' },
  { value: 'INTERNAL', label: '🏢 Внутренние' },
];

const CATEGORY_ICONS: Record<string, string> = {
  application: '📝',
  certificate: '📜',
  act: '📋',
  letter: '✉️',
  form: '📄',
  report: '📊',
  order: '📌',
};

export default function TemplatesPage() {
  const [category, setCategory] = useState<string | undefined>();
  const [standard, setStandard] = useState<string | undefined>();
  const [preview, setPreview] = useState<any>(null);

  const params: Record<string, string | undefined> = {};
  if (category) params.category = category;
  if (standard) params.standard = standard;

  const { data, isLoading, mutate } = useSWR(
    ['doc-templates', category, standard],
    () => documentTemplatesApi.list(params)
  );

  const templates = data?.items || [];

  return (
    <PageLayout
      title="Шаблоны документов"
      subtitle={isLoading ? 'Загрузка...' : `${data?.total || 0} шаблонов`}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <FilterBar value={category} onChange={setCategory} options={CATEGORIES} className="mb-0" />
        <FilterBar value={standard} onChange={setStandard} options={STANDARDS} className="mb-0" />
      </div>

      {!isLoading && templates.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((t: any) => (
            <div
              key={t.id}
              onClick={() => setPreview(t)}
              className="group cursor-pointer rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-primary-300 hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{CATEGORY_ICONS[t.category] || '📄'}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-primary-500 group-hover:underline">{t.name}</div>
                  <div className="mt-1 text-xs text-gray-500">
                    {t.code} · v{t.version}
                  </div>
                  {t.description && (
                    <div className="mt-2 line-clamp-2 text-xs text-gray-400">{t.description}</div>
                  )}
                  <div className="mt-2 flex gap-2">
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">{t.standard}</span>
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">{t.category}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !isLoading ? (
        <EmptyState message="Нет шаблонов по выбранным фильтрам." />
      ) : null}

      {preview && (
        <DocumentPreviewModal
          template={preview}
          onClose={() => setPreview(null)}
          onSaved={() => mutate()}
        />
      )}
    </PageLayout>
  );
}
