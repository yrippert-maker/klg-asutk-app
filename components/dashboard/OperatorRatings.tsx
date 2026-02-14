'use client';

interface Rating { operator: string; totalAircraft: number; activeAircraft: number; maintenanceAircraft: number; rating: number; category: 'best' | 'average' | 'worst'; }
interface Props { ratings: Rating[]; }

const catConfig = {
  best: { title: '🏆 Лучшие по КЛГ', bg: 'bg-green-50', border: 'border-green-200', ratingColor: 'text-green-600' },
  average: { title: '📊 Средние', bg: 'bg-yellow-50', border: 'border-yellow-200', ratingColor: 'text-yellow-600' },
  worst: { title: '⚠️ Требуют внимания', bg: 'bg-red-50', border: 'border-red-200', ratingColor: 'text-red-600' },
};

export default function OperatorRatings({ ratings }: Props) {
  if (!ratings.length) return null;

  return (
    <section>
      <h3 className="text-lg font-bold mb-3">📈 Рейтинг операторов по КЛГ</h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {(['best', 'average', 'worst'] as const).map(cat => {
          const items = ratings.filter(r => r.category === cat);
          const cfg = catConfig[cat];
          return (
            <div key={cat} className={`card p-4 ${cfg.bg} border ${cfg.border}`}>
              <h4 className="text-sm font-bold mb-3">{cfg.title}</h4>
              {items.length > 0 ? items.map((r, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <div className="text-sm font-medium">{r.operator}</div>
                    <div className="text-xs text-gray-500">ВС: {r.totalAircraft} (акт: {r.activeAircraft}, ТО: {r.maintenanceAircraft})</div>
                  </div>
                  <div className={`text-lg font-bold ${cfg.ratingColor}`}>{r.rating}%</div>
                </div>
              )) : <div className="text-xs text-gray-400 py-2">Нет данных</div>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
