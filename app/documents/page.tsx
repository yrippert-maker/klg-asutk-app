'use client';
import DocumentViewModal from '@/components/DocumentViewModal';
import { PageLayout } from '@/components/ui';

export default function DocumentsPage() {
  const links = [
    { title: 'Входящие документы', desc: 'PDF и DOCX файлы', href: '/inbox', icon: '📥' },
    { title: 'Вложения аудитов', desc: 'Фото и протоколы', href: '/audits', icon: '🔍' },
    { title: 'Сертификаты', desc: 'Сертификаты ЛГ', href: '/airworthiness', icon: '📜' },
    { title: 'Нормативные документы', desc: 'Part-M RU · ФАП', href: '/regulations', icon: '📚' },
    { title: 'Чек-листы', desc: 'Шаблоны проверок', href: '/checklists', icon: '✅' },
    { title: 'Шаблоны документов', desc: 'Заявки, акты, письма, формы', href: '/templates', icon: '📋' },
  ];
  return (
    <PageLayout title="Документы" subtitle="Просмотр документов, прикреплённых к ВС, аудитам и заявкам">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {links.map(l => (
          <a key={l.href} href={l.href} className="card p-6 no-underline text-inherit hover:shadow-md transition-shadow">
            <div className="text-3xl mb-3">{l.icon}</div>
            <div className="text-base font-bold text-primary-500 mb-1">{l.title}</div>
            <div className="text-xs text-gray-500">{l.desc}</div>
          </a>
        ))}
      </div>
    </PageLayout>
  );
}
