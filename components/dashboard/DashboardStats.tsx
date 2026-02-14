'use client';
import { StatCard } from '@/components/ui';

interface Props {
  aircraftStats: { total: number; active: number; maintenance: number; types: Map<string, number> };
  risksStats: { total: number; critical: number; high: number; medium: number; low: number };
  auditsStats: { current: number; upcoming: number; completed: number };
  onNavigate: (path: string) => void;
}

export default function DashboardStats({ aircraftStats, risksStats, auditsStats, onNavigate }: Props) {
  return (
    <div className="space-y-6">
      {/* Aircraft */}
      <section>
        <h3 className="text-lg font-bold mb-3">✈️ Воздушные суда</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Всего ВС" value={aircraftStats.total} border="border-l-primary-500" icon="✈️" onClick={() => onNavigate('/aircraft')} />
          <StatCard label="Активных" value={aircraftStats.active} border="border-l-green-500" />
          <StatCard label="На ТО" value={aircraftStats.maintenance} border="border-l-orange-500" onClick={() => onNavigate('/maintenance')} />
          <StatCard label="Типов ВС" value={aircraftStats.types.size} border="border-l-blue-500" />
        </div>
      </section>

      {/* Risks */}
      <section>
        <h3 className="text-lg font-bold mb-3">⚠️ Предупреждения о рисках</h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard label="Всего" value={risksStats.total} border="border-l-gray-400" onClick={() => onNavigate('/risks')} />
          <StatCard label="Критических" value={risksStats.critical} border="border-l-red-600" />
          <StatCard label="Высоких" value={risksStats.high} border="border-l-orange-500" />
          <StatCard label="Средних" value={risksStats.medium} border="border-l-yellow-500" />
          <StatCard label="Низких" value={risksStats.low} border="border-l-green-500" />
        </div>
      </section>

      {/* Audits */}
      <section>
        <h3 className="text-lg font-bold mb-3">🔍 Аудиты</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <StatCard label="В процессе" value={auditsStats.current} border="border-l-blue-500" onClick={() => onNavigate('/audits')} />
          <StatCard label="Запланировано" value={auditsStats.upcoming} border="border-l-purple-500" />
          <StatCard label="Завершено" value={auditsStats.completed} border="border-l-green-500" />
        </div>
      </section>
    </div>
  );
}
