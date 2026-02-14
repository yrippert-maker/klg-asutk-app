'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const PATH_LABELS: Record<string, string> = {
  dashboard: '📊 Дашборд', aircraft: '✈️ ВС', airworthiness: '📜 ЛГ',
  'airworthiness-core': '🔧 Контроль ЛГ', maintenance: '📐 ТО',
  defects: '🛠️ Дефекты', 'personnel-plg': '🎓 Персонал',
  calendar: '📅 Календарь', risks: '⚠️ Риски', checklists: '✅ Чек-листы',
  regulator: '🏛️ ФАВТ', applications: '📋 Заявки', modifications: '⚙️ Модификации',
  organizations: '🏢 Организации', inbox: '📥 Входящие', settings: '⚙️ Настройки',
  profile: '👤 Профиль', help: '📚 Справка', 'audit-history': '📝 Аудит',
  print: '🖨️ Печать', crs: 'CRS',
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  if (!pathname || pathname === '/') return null;

  const parts = pathname.split('/').filter(Boolean);
  if (parts.length <= 1) return null;

  return (
    <nav className="text-xs text-gray-400 mb-3 flex items-center gap-1">
      <Link href="/dashboard" className="hover:text-blue-500">Главная</Link>
      {parts.map((part, i) => {
        const path = '/' + parts.slice(0, i + 1).join('/');
        const isLast = i === parts.length - 1;
        return (
          <span key={path} className="flex items-center gap-1">
            <span>›</span>
            {isLast ? (
              <span className="text-gray-600">{PATH_LABELS[part] || part}</span>
            ) : (
              <Link href={path} className="hover:text-blue-500">{PATH_LABELS[part] || part}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
