/**
 * Лётная годность — перенаправление на расширенный модуль
 */
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/ui';
import Link from 'next/link';

export default function AirworthinessPage() {
  return (
    <PageLayout title="📜 Лётная годность" subtitle="Модули контроля ЛГ">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Link href="/airworthiness-core" className="card p-6 hover:shadow-lg transition-shadow">
          <div className="text-2xl mb-2">🔧</div>
          <div className="font-bold text-sm">Контроль ЛГ (полный модуль)</div>
          <div className="text-xs text-gray-500 mt-1">AD/ДЛГ · Бюллетени · Ресурсы · Программы ТО · Компоненты</div>
        </Link>
        <Link href="/maintenance" className="card p-6 hover:shadow-lg transition-shadow">
          <div className="text-2xl mb-2">📐</div>
          <div className="font-bold text-sm">Наряды на ТО</div>
          <div className="text-xs text-gray-500 mt-1">Work Orders · CRS · AOG priority</div>
        </Link>
        <Link href="/defects" className="card p-6 hover:shadow-lg transition-shadow">
          <div className="text-2xl mb-2">🛠️</div>
          <div className="font-bold text-sm">Дефекты</div>
          <div className="text-xs text-gray-500 mt-1">Регистрация · Устранение · MEL deferral</div>
        </Link>
        <Link href="/personnel-plg" className="card p-6 hover:shadow-lg transition-shadow">
          <div className="text-2xl mb-2">🎓</div>
          <div className="font-bold text-sm">Персонал ПЛГ</div>
          <div className="text-xs text-gray-500 mt-1">Аттестация · 11 программ · Compliance</div>
        </Link>
      </div>
    </PageLayout>
  );
}
