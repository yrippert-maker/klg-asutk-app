'use client';
import { PageLayout, DataTable, StatusBadge, Modal, EmptyState } from '@/components/ui';

export type Tab = 'control' | 'directives' | 'bulletins' | 'life-limits' | 'maint-programs' | 'components';

export interface ControlRecord {
  id: string;
  registration: string;
  aircraft_type: string;
  last_check_date: string;
  status: string;
  valid_until: string;
  responsible: string;
  notes?: string;
  history?: { date: string; type: string; result: string }[];
}

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-500', complied: 'bg-green-500', incorporated: 'bg-green-500',
  not_applicable: 'bg-gray-400', deferred: 'bg-yellow-500',
  serviceable: 'bg-green-500', unserviceable: 'bg-red-500', overhauled: 'bg-blue-500', scrapped: 'bg-gray-400',
  mandatory: 'bg-red-500', alert: 'bg-orange-500', recommended: 'bg-blue-500', info: 'bg-gray-400',
};
const STATUS_LABELS: Record<string, string> = {
  open: 'Открыта', complied: 'Выполнена', incorporated: 'Внедрён',
  not_applicable: 'Неприменимо', deferred: 'Отложена',
  serviceable: 'Исправен', unserviceable: 'Неисправен', overhauled: 'После ремонта', scrapped: 'Списан',
  mandatory: 'Обязат.', alert: 'Важный', recommended: 'Рекоменд.', info: 'Информ.',
};

export const TABS: { id: Tab; label: string; icon: string; basis: string }[] = [
  { id: 'control', label: 'Контроль ЛГ', icon: '✈️', basis: 'ВК РФ ст. 36; ФАП-148; Контроль лётной годности ВС' },
  { id: 'directives', label: 'ДЛГ / AD', icon: '⚠️', basis: 'ВК РФ ст. 37; ФАП-148 п.4.3' },
  { id: 'bulletins', label: 'Бюллетени SB', icon: '📢', basis: 'ФАП-148 п.4.5; EASA Part-21' },
  { id: 'life-limits', label: 'Ресурсы', icon: '⏱️', basis: 'ФАП-148 п.4.2; EASA Part-M.A.302' },
  { id: 'maint-programs', label: 'Программы ТО', icon: '📋', basis: 'ФАП-148 п.3; ICAO Annex 6' },
  { id: 'components', label: 'Компоненты', icon: '🔩', basis: 'ФАП-145 п.A.42; EASA Part-M.A.501' },
];

interface Props {
  tab: Tab;
  setTab: (t: Tab) => void;
  loading: boolean;
  setShowAddModal: (v: boolean) => void;
  controlFilter: string;
  setControlFilter: (v: string) => void;
  controlSort: 'registration' | 'last_check_date' | 'status';
  setControlSort: (v: 'registration' | 'last_check_date' | 'status') => void;
  filteredControl: ControlRecord[];
  setSelectedControl: (r: ControlRecord | null) => void;
  items: unknown[];
  currentTab: { id: Tab; label: string; icon: string; basis: string };
  selectedControl: ControlRecord | null;
  downloadCertificate: (r: ControlRecord) => void;
}

function AirworthinessCoreViewContent(p: Props) {
  return (
    <PageLayout title="Контроль летной годности"
      subtitle="Директивы, бюллетени, ресурсы, программы ТО, компоненты"
      actions={<button onClick={() => p.setShowAddModal(true)} className="btn-primary text-sm px-4 py-2 rounded">+ Добавить</button>}>
      <div className="p-4 text-gray-600">Модуль контроля лётной годности. Загрузка интерфейса временно упрощена.</div>
    </PageLayout>
  );
}

export default function AirworthinessCoreView(p: Props) {
  return AirworthinessCoreViewContent(p);
}
