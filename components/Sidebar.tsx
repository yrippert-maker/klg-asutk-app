'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NotificationBell from './NotificationBell';

const menuItems = [
  { name: 'Дашборд', path: '/dashboard', icon: '📊' },
  { name: 'Организации', path: '/organizations', icon: '🏢' },
  { name: 'ВС и типы', path: '/aircraft', icon: '✈️' },
  { name: 'Заявки', path: '/applications', icon: '📋' },
  { name: 'Чек-листы', path: '/checklists', icon: '✅' },
  { name: 'Аудиты', path: '/audits', icon: '🔍' },
  { name: 'Риски', path: '/risks', icon: '⚠️' },
  { name: 'Пользователи', path: '/users', icon: '👥' },
  { name: 'Документы', path: '/documents', icon: '📄' },
  { name: 'Inbox', path: '/inbox', icon: '📥' },
  { name: 'Нормативные документы', path: '/regulations', icon: '📚' },
  { name: 'Мониторинг', path: '/monitoring', icon: '📈' },
  { name: 'История изменений', path: '/audit-history', icon: '📝' },
  { name: 'Задачи Jira', path: '/jira-tasks', icon: '🎯' },
  { name: 'API Документация', path: '/api-docs', icon: '📖' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
        role="complementary"
        aria-label="Боковая панель навигации"
        style={{
          width: '280px',
          backgroundColor: '#1e3a5f',
          color: 'white',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          left: 0,
          top: 0,
        }}
      >
      <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}
          >
            ✈️
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', letterSpacing: '2px' }}>
            REFLY
          </div>
        </div>
        <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>
          КОНТРОЛЬ ЛЁТНОЙ ГОДНОСТИ
        </div>
        <div style={{ fontSize: '12px', opacity: 0.8 }}>АСУ ТК</div>
      </div>

      <nav 
        role="navigation"
        aria-label="Основная навигация"
        style={{ flex: 1, padding: '16px 0' }}
      >
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 24px',
                color: 'white',
                textDecoration: 'none',
                backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                borderLeft: isActive ? '3px solid #4a90e2' : '3px solid transparent',
                outline: 'none',
                transition: 'background-color 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
              }}
              onBlur={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span 
                aria-hidden="true"
                style={{ marginRight: '12px', fontSize: '18px' }}
              >
                {item.icon}
              </span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
          <NotificationBell />
        </div>
        <button
          aria-label="Выйти из системы"
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'white',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            outline: 'none',
            transition: 'background-color 0.2s',
          }}
          onFocus={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              // Здесь будет логика выхода
            }
          }}
        >
          <span aria-hidden="true" style={{ marginRight: '8px' }}>🚪</span>
          Выйти
        </button>
      </div>
    </aside>
  );
}
