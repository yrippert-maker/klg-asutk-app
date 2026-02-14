/**
 * Reusable page layout with Sidebar.
 * Replaces repeated page-container + main-content pattern.
 */
'use client';
import Breadcrumbs from '@/components/Breadcrumbs';
import NotificationBell from '@/components/NotificationBell';
import Sidebar from '@/components/Sidebar';
import Logo from '@/components/Logo';

interface Props {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export default function PageLayout({ title, subtitle, actions, children }: Props) {
  return (
    <div className="page-container">
      <Sidebar />
      <div className="main-content">
        <div className="mb-8"><Logo size="large" /></div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="page-title">{title}</h2>
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="flex gap-2 items-center">{actions}</div>}
        </div>
        {children}
      </div>
    </div>
  );
}
