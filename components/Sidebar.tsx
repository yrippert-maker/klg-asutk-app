/**
 * Sidebar navigation — RBAC-aware, Tailwind CSS.
 * Разработчик: АО «REFLY»
 */
'use client';

import { useState } from 'react';
import { useDarkMode } from '@/hooks/useDarkMode';
import Link from 'next/link';
import GlobalSearch from './GlobalSearch';
import { usePathname } from 'next/navigation';
import NotificationBell from './NotificationBell';
import { useAuth, UserRole } from '@/lib/auth-context';
import { sidebarIcons, commonIcons } from '@/icons/refly-icons';
import type { SidebarKey } from '@/icons/refly-icons';
import { Icon } from '@/components/Icon';

const HEADER_ICON_KEY: SidebarKey = 'aircraft';

interface MenuItem { name: string; path: string; iconKey: SidebarKey; roles?: UserRole[]; }

const menuItems: MenuItem[] = [
  { name: 'Дашборд', path: '/dashboard', iconKey: 'dashboard' },
  { name: 'Организации', path: '/organizations', iconKey: 'organizations' },
  { name: 'ВС и типы', path: '/aircraft', iconKey: 'aircraft' },
  { name: 'Заявки', path: '/applications', iconKey: 'applications' },
  { name: 'Чек-листы', path: '/checklists', iconKey: 'checklists' },
  { name: 'Аудиты', path: '/audits', iconKey: 'audits' },
  { name: 'Риски', path: '/risks', iconKey: 'risks' },
  { name: 'Пользователи', path: '/users', iconKey: 'users', roles: ['admin', 'authority_inspector'] },
  { name: 'Лётная годность', path: '/airworthiness', iconKey: 'airworthiness' },
  { name: 'Календарь ТО', path: '/calendar', iconKey: 'calendar' },
  { name: 'Контроль ЛГ', path: '/airworthiness-core', iconKey: 'airworthiness-core' },
  { name: 'Тех. обслуживание', path: '/maintenance', iconKey: 'maintenance' },
  { name: 'Дефекты', path: '/defects', iconKey: 'defects' },
  { name: 'Модификации', path: '/modifications', iconKey: 'modifications' },
  { name: 'Документы', path: '/documents', iconKey: 'documents' },
  { name: 'Inbox', path: '/inbox', iconKey: 'inbox' },
  { name: 'Нормативные документы', path: '/regulations', iconKey: 'regulations' },
  { name: 'Мониторинг', path: '/monitoring', iconKey: 'monitoring', roles: ['admin', 'authority_inspector'] },
  { name: 'История изменений', path: '/audit-history', iconKey: 'audit-history', roles: ['admin', 'authority_inspector'] },
  { name: 'API Документация', path: '/api-docs', iconKey: 'api-docs', roles: ['admin'] },
  { name: 'Аналитика', path: '/analytics', iconKey: 'analytics', roles: ['admin', 'authority_inspector'] },
  { name: 'Персонал ПЛГ', path: '/personnel-plg', iconKey: 'personnel-plg' },
  { name: 'Профиль', path: '/profile', iconKey: 'profile' },
  { name: 'Справка', path: '/help', iconKey: 'help' },
  { name: 'Настройки', path: '/settings', iconKey: 'settings' },
  { name: 'ФГИС РЭВС', path: '/fgis-revs', iconKey: 'fgis-revs', roles: ['admin'] },
  { name: 'Панель ФАВТ', path: '/regulator', iconKey: 'regulator', roles: ['admin', 'favt_inspector'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, hasRole } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isDark, toggle: toggleDark } = useDarkMode();

  const visibleItems = menuItems.filter(item => !item.roles || item.roles.some(r => hasRole(r)));

  return (
    <>
      {/* Mobile hamburger */}
      <button onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-primary-500 text-white rounded-lg flex items-center justify-center text-xl shadow-lg"
        aria-label="Открыть меню">☰</button>

      {/* Mobile overlay */}
      {mobileOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />}

      <aside role="complementary" aria-label="Навигация"
        className={`w-[280px] bg-primary-500 text-white h-screen flex flex-col fixed left-0 top-0 z-50
          transition-transform duration-300 lg:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Icon icon={sidebarIcons[HEADER_ICON_KEY]} className="size-6 text-white" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold tracking-wider">REFLY</div>
        </div>
        <div className="text-xs opacity-80">КОНТРОЛЬ ЛЁТНОЙ ГОДНОСТИ</div>
        <div className="text-xs opacity-80">АСУ ТК</div>
        {user && (
          <div className="mt-3 p-2 bg-white/[0.08] rounded-md">
            <div className="text-sm font-bold truncate">{user.display_name}</div>
            <div className="text-xs opacity-70 truncate">{user.role} · {user.organization_name || '—'}</div>
          </div>
        )}
      </div>

      <div className="p-3"><GlobalSearch /></div>
      {/* Navigation */}
      <nav role="navigation" aria-label="Основная навигация" className="flex-1 py-4 overflow-y-auto">
        {visibleItems.map((item) => {
          const active = pathname === item.path;
          return (
            <Link key={item.path} href={item.path} scroll={false} aria-current={active ? 'page' : undefined}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center px-6 py-3 text-white no-underline transition-colors
                ${active ? 'bg-white/[0.15] border-l-[3px] border-accent-blue' : 'border-l-[3px] border-transparent hover:bg-white/[0.07]'}`}>
              <span aria-hidden="true" className="mr-3 flex shrink-0 [&>svg]:size-5">
                <Icon icon={sidebarIcons[item.iconKey]} className="text-current" />
              </span>
              <span className="text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="mb-3 flex justify-center gap-2">
          <NotificationBell />
          <button onClick={toggleDark} className="w-8 h-8 rounded bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors" title="Тема" aria-label={isDark ? 'Светлая тема' : 'Тёмная тема'}>
            <Icon icon={isDark ? commonIcons.themeLight : commonIcons.themeDark} className="size-5 text-current" />
          </button>
        </div>
        <button aria-label="Выйти" onClick={logout}
          className="w-full py-3 bg-transparent border border-white/20 text-white rounded cursor-pointer
                     flex items-center justify-center hover:bg-white/10 transition-colors">
          <Icon icon={commonIcons.logout} className="mr-2 size-5 shrink-0 text-current" />
          Выйти
        </button>
      </div>
    </aside>
    </>
  );
}
