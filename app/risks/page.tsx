'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import RiskDetailsModal from '@/components/RiskDetailsModal';
import Logo from '@/components/Logo';

interface Risk {
  id: string;
  title: string;
  level: 'Низкий' | 'Средний' | 'Высокий' | 'Критический';
  category: string;
  aircraft: string;
  status: string;
  date: string;
  description?: string;
  impact?: string;
  probability?: string;
  mitigation?: string;
  responsible?: string;
  deadline?: string;
}

export default function RisksPage() {
  const [filter, setFilter] = useState<'all' | 'critical' | 'high'>('all');
  const [risks, setRisks] = useState<Risk[]>([
    {
      id: '1',
      title: 'Превышение межремонтного ресурса',
      level: 'Высокий',
      category: 'Техническое состояние',
      aircraft: 'RA-12345',
      status: 'Требует внимания',
      date: '2025-01-20',
      description: 'Воздушное судно RA-12345 превысило установленный межремонтный ресурс на 150 часов. Требуется немедленное проведение планового технического обслуживания для обеспечения безопасности полетов.',
      impact: 'Высокое влияние на безопасность полетов. Возможны ограничения на эксплуатацию воздушного судна до проведения ремонта.',
      probability: 'Высокая вероятность возникновения инцидентов при продолжении эксплуатации без ремонта.',
      mitigation: '1. Немедленно ограничить эксплуатацию воздушного судна\n2. Назначить ответственного за проведение ремонта\n3. Провести плановое техническое обслуживание в течение 7 дней\n4. Обновить документацию после завершения ремонта',
      responsible: 'Иванов И.И., главный инженер',
      deadline: '2025-01-27',
    },
    {
      id: '2',
      title: 'Несоответствие документации',
      level: 'Средний',
      category: 'Документация',
      aircraft: 'RA-67890',
      status: 'В работе',
      date: '2025-01-19',
      description: 'Обнаружены расхождения между фактическим состоянием воздушного судна и документацией. Отсутствуют записи о последнем техническом обслуживании.',
      impact: 'Среднее влияние. Может привести к задержкам при проверках и аудитах.',
      probability: 'Средняя вероятность возникновения проблем при проверках.',
      mitigation: '1. Провести инвентаризацию документации\n2. Восстановить недостающие записи\n3. Согласовать документацию с фактическим состоянием\n4. Внедрить систему контроля документации',
      responsible: 'Петров П.П., специалист по документации',
      deadline: '2025-01-25',
    },
    {
      id: '3',
      title: 'Критическая неисправность системы управления',
      level: 'Критический',
      category: 'Техническое состояние',
      aircraft: 'RA-11111',
      status: 'Требует внимания',
      date: '2025-01-21',
      description: 'Обнаружена критическая неисправность в системе управления воздушным судном. Требуется немедленное устранение.',
      impact: 'Критическое влияние на безопасность полетов. Эксплуатация воздушного судна запрещена до устранения неисправности.',
      probability: 'Очень высокая вероятность аварии при продолжении эксплуатации.',
      mitigation: '1. Немедленно запретить эксплуатацию воздушного судна\n2. Провести полную диагностику системы управления\n3. Заменить неисправные компоненты\n4. Провести тестовые полеты после ремонта',
      responsible: 'Сидоров С.С., главный инженер',
      deadline: '2025-01-23',
    },
  ]);

  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSaveRisk = (updatedRisk: Risk) => {
    setRisks(prev => prev.map(r => r.id === updatedRisk.id ? updatedRisk : r));
    setSelectedRisk(updatedRisk);
  };

  const filteredRisks = risks.filter(risk => {
    if (filter === 'all') {
      return true;
    }
    if (filter === 'critical') {
      return risk.level === 'Критический';
    }
    if (filter === 'high') {
      return risk.level === 'Высокий';
    }
    return true;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Критический': return '#f44336';
      case 'Высокий': return '#ff9800';
      case 'Средний': return '#ffc107';
      case 'Низкий': return '#4caf50';
      default: return '#666';
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div id="main-content" role="main" style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ marginBottom: '32px' }}>
          <Logo size="large" />
          <p style={{ fontSize: '16px', color: '#666', marginTop: '16px', marginBottom: '24px' }}>
            Система контроля лётной годности воздушных судов · Безопасность и качество
          </p>
        </div>

        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
              Риски
            </h2>
            <p style={{ fontSize: '14px', color: '#666' }}>
              Управление рисками и оценка безопасности воздушных судов
            </p>
          </div>
          <div>
            <button style={{
              padding: '10px 20px',
              backgroundColor: '#1e3a5f',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}>
              Добавить риск
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '24px', display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '8px 16px',
              backgroundColor: filter === 'all' ? '#1e3a5f' : 'transparent',
              color: filter === 'all' ? 'white' : '#1e3a5f',
              border: '1px solid #1e3a5f',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Все
          </button>
          <button
            onClick={() => setFilter('critical')}
            style={{
              padding: '8px 16px',
              backgroundColor: filter === 'critical' ? '#f44336' : 'transparent',
              color: filter === 'critical' ? 'white' : '#1e3a5f',
              border: '1px solid #1e3a5f',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Критические
          </button>
          <button
            onClick={() => setFilter('high')}
            style={{
              padding: '8px 16px',
              backgroundColor: filter === 'high' ? '#ff9800' : 'transparent',
              color: filter === 'high' ? 'white' : '#1e3a5f',
              border: '1px solid #1e3a5f',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Высокие
          </button>
        </div>

        {filteredRisks.length === 0 ? (
          <div style={{
            backgroundColor: '#e3f2fd',
            padding: '40px',
            borderRadius: '8px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
              {filter === 'critical' && 'Критические риски не найдены'}
              {filter === 'high' && 'Высокие риски не найдены'}
              {filter === 'all' && 'Риски не найдены'}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              {filter === 'critical' && 'В данный момент нет критических рисков'}
              {filter === 'high' && 'В данный момент нет высоких рисков'}
              {filter === 'all' && 'Добавьте риски для отображения'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredRisks.map(risk => (
            <div key={risk.id} style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              borderLeft: `4px solid ${getLevelColor(risk.level)}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                    {risk.title}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                    Категория: {risk.category} | ВС: {risk.aircraft}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    Дата выявления: {risk.date}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: getLevelColor(risk.level),
                    color: 'white',
                  }}>
                    {risk.level}
                  </span>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: '#e0e0e0',
                    color: '#333',
                  }}>
                    {risk.status}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedRisk(risk);
                      setIsModalOpen(true);
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#1e3a5f',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    Открыть
                  </button>
                </div>
              </div>
            </div>
            ))}
          </div>
        )}

        <RiskDetailsModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedRisk(null);
          }}
          risk={selectedRisk}
          onSave={handleSaveRisk}
        />
      </div>
    </div>
  );
}
