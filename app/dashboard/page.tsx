'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import FileUploadModal from '@/components/FileUploadModal';
import AIAgentModal from '@/components/AIAgentModal';
import SearchModal from '@/components/SearchModal';
import ExportModal from '@/components/ExportModal';
import Logo from '@/components/Logo';
import NotificationBell from '@/components/NotificationBell';
import SettingsModal from '@/components/SettingsModal';
import SemanticSearch from '@/components/SemanticSearch';
import AutonomousAgentInterface from '@/components/AutonomousAgentInterface';
import KnowledgeGraphVisualization from '@/components/KnowledgeGraphVisualization';
import { Aircraft } from '@/lib/api';
import { useGlobalShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useAircraftData, useStatsData, useRisksData, useAuditsData } from '@/hooks/useSWRData';
import { logInfo } from '@/lib/logger-client';

export default function DashboardPage() {
  const router = useRouter();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAIAgentModalOpen, setIsAIAgentModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  // ARC-004: только SWR, без прямого fetch (избегаем двойной нагрузки на API)
  const { data: aircraftData, isLoading: aircraftLoading, error: aircraftError, mutate: mutateAircraft } = useAircraftData();
  const { data: statsData, error: statsError } = useStatsData();
  const { data: risksData } = useRisksData();
  const { data: auditsData } = useAuditsData();

  const aircraft = useMemo(() => {
    if (Array.isArray(aircraftData)) return aircraftData;
    if (aircraftData?.data) return aircraftData.data;
    return [];
  }, [aircraftData]);

  const directRisks = Array.isArray(risksData) ? risksData : (Array.isArray(risksData?.data) ? risksData.data : []);
  const directAudits = Array.isArray(auditsData) ? auditsData : (Array.isArray(auditsData?.data) ? auditsData.data : []);

  const [loadingTimeout, setLoadingTimeout] = useState(false);
  useEffect(() => {
    if (aircraftLoading) {
      const timeout = setTimeout(() => setLoadingTimeout(true), 5000);
      return () => clearTimeout(timeout);
    }
    setLoadingTimeout(false);
    return undefined;
  }, [aircraftLoading]);

  const hasAnyData = aircraft.length > 0;
  const isLoading = !hasAnyData && aircraftLoading && !aircraftError && !loadingTimeout;
  
  const stats = statsData || {
    aircraft: { total: 0, active: 0, maintenance: 0 },
    risks: { total: 0, critical: 0, high: 0 },
    audits: { current: 0, upcoming: 0, completed: 0 },
  };

  // Глобальные горячие клавиши
  useGlobalShortcuts({
    onSearch: () => setIsSearchModalOpen(true),
    onCreateNew: () => router.push('/aircraft'),
    onClose: () => {
      setIsUploadModalOpen(false);
      setIsAIAgentModalOpen(false);
      setIsSearchModalOpen(false);
      setIsExportModalOpen(false);
    },
  });

  // Вычисление статистики из данных
  const [computedStats, setComputedStats] = useState({
    total: 0,
    active: 0,
    maintenance: 0,
    types: new Map<string, number>(),
    operators: new Map<string, number>(),
  });

  const [risksStats, setRisksStats] = useState({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  });

  const [auditsStats, setAuditsStats] = useState({
    current: 0,
    upcoming: 0,
    completed: 0,
  });

  const [operatorRatings, setOperatorRatings] = useState<Array<{
    operator: string;
    totalAircraft: number;
    activeAircraft: number;
    maintenanceAircraft: number;
    rating: number;
    category: 'best' | 'average' | 'worst';
  }>>([]);

  useEffect(() => {
    if (aircraft.length > 0) {
      const newStats = {
        total: aircraft.length,
        active: 0,
        maintenance: 0,
        types: new Map<string, number>(),
        operators: new Map<string, number>(),
      };

      aircraft.forEach((a: Aircraft) => {
        if (a.status?.toLowerCase().includes('активен')) {
          newStats.active++;
        }
        if (a.status?.toLowerCase().includes('обслуживан') || a.status?.toLowerCase().includes('ремонт')) {
          newStats.maintenance++;
        }
        
        if (a.aircraftType) {
          newStats.types.set(a.aircraftType, (newStats.types.get(a.aircraftType) || 0) + 1);
        }
        
        if (a.operator) {
          newStats.operators.set(a.operator, (newStats.operators.get(a.operator) || 0) + 1);
        }
      });

      setComputedStats(newStats);
    }
  }, [aircraft]);

  // Обновляем статистику рисков: приоритет прямым данным
  useEffect(() => {
    if (directRisks.length > 0) {
      // Используем прямые данные (приоритет)
      const calculatedStats = {
        total: directRisks.length,
        critical: directRisks.filter((r: any) => r.level === 'Критический').length,
        high: directRisks.filter((r: any) => r.level === 'Высокий').length,
        medium: directRisks.filter((r: any) => r.level === 'Средний').length,
        low: directRisks.filter((r: any) => r.level === 'Низкий').length,
      };
      setRisksStats(calculatedStats);
    } else if (stats.risks && (stats.risks.total > 0 || stats.risks.critical > 0 || stats.risks.high > 0)) {
      // Используем данные из stats, если прямые данные недоступны
      setRisksStats({
        total: stats.risks.total || 0,
        critical: stats.risks.critical || 0,
        high: stats.risks.high || 0,
        medium: 0,
        low: 0,
      });
    }
  }, [stats.risks, directRisks]);

  // Обновляем статистику аудитов: приоритет прямым данным
  useEffect(() => {
    if (directAudits.length > 0) {
      // Используем прямые данные (приоритет)
      const now = new Date();
      const calculatedStats = {
        current: directAudits.filter((a: any) => a.status === 'В процессе').length,
        upcoming: directAudits.filter((a: any) => {
          if (a.status !== 'Запланирован' || !a.date) {
            return false;
          }
          const auditDate = new Date(a.date);
          return auditDate >= now;
        }).length,
        completed: directAudits.filter((a: any) => a.status === 'Завершён').length,
      };
      setAuditsStats(calculatedStats);
    } else if (stats.audits && (stats.audits.current > 0 || stats.audits.upcoming > 0 || stats.audits.completed > 0)) {
      // Используем данные из stats, если прямые данные недоступны
      setAuditsStats({
        current: stats.audits.current || 0,
        upcoming: stats.audits.upcoming || 0,
        completed: stats.audits.completed || 0,
      });
    }
  }, [stats.audits, directAudits]);

  useEffect(() => {
    if (aircraft.length > 0) {
      const operatorData = new Map<string, { total: number; active: number; maintenance: number }>();

      aircraft.forEach((a: Aircraft) => {
        if (!a.operator) {
          return;
        }
        
        if (!operatorData.has(a.operator)) {
          operatorData.set(a.operator, { total: 0, active: 0, maintenance: 0 });
        }
        
        const data = operatorData.get(a.operator)!;
        data.total++;
        
        if (a.status?.toLowerCase().includes('активен')) {
          data.active++;
        }
        if (a.status?.toLowerCase().includes('обслуживан') || a.status?.toLowerCase().includes('ремонт')) {
          data.maintenance++;
        }
      });

      const ratings = Array.from(operatorData.entries()).map(([operator, data]) => {
        const activePercent = data.total > 0 ? (data.active / data.total) * 100 : 0;
        const maintenancePercent = data.total > 0 ? (data.maintenance / data.total) * 100 : 0;
        
        const rating = Math.round(
          activePercent * 0.5 +
          (100 - maintenancePercent) * 0.3 +
          Math.min(data.total / 10, 1) * 100 * 0.2
        );

        return {
          operator,
          totalAircraft: data.total,
          activeAircraft: data.active,
          maintenanceAircraft: data.maintenance,
          rating,
          category: rating >= 80 ? 'best' as const : rating >= 50 ? 'average' as const : 'worst' as const,
        };
      }).sort((a, b) => b.rating - a.rating);

      setOperatorRatings(ratings);
    }
  }, [aircraft]);

  const handleFileUpload = async (files: File[]) => {
    logInfo('Загружено файлов', { count: files.length });
    // Здесь будет логика загрузки файлов
  };

  const handleNavigate = (path: string) => {
    router.push(path);
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
              Дашборд
            </h2>
            <p style={{ fontSize: '14px', color: '#666' }}>
              Общая статистика и аналитика системы контроля лётной годности
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <NotificationBell />
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              title="Настройки"
              aria-label="Открыть настройки"
            >
              <span>⚙️</span>
              <span>Настройки</span>
            </button>
            <button
              onClick={() => setIsAIAgentModalOpen(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#1e3a5f',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>🤖</span>
              <span>ИИ Агент</span>
            </button>
            <button
              onClick={() => setIsSearchModalOpen(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
              title="Ctrl+K"
            >
              Поиск
            </button>
            <button
              onClick={() => setIsExportModalOpen(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>📥</span>
              <span>Экспорт</span>
            </button>
          </div>
        </div>

        {aircraftError ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '16px', color: '#f44336' }}>
              Ошибка загрузки данных: {aircraftError.message || 'Неизвестная ошибка'}
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '16px',
                padding: '8px 16px',
                backgroundColor: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Перезагрузить страницу
            </button>
          </div>
        ) : isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '16px', color: '#666' }}>Загрузка данных...</div>
            <div style={{ marginTop: '16px', fontSize: '14px', color: '#999' }}>
              Пожалуйста, подождите...
            </div>
            <button
              onClick={() => mutateAircraft()}
              style={{
                marginTop: '16px',
                padding: '8px 16px',
                backgroundColor: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Повторить загрузку
            </button>
          </div>
        ) : aircraft.length === 0 && !aircraftLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '16px', color: '#666' }}>Нет данных для отображения</div>
            <button
              onClick={() => mutateAircraft()}
              style={{
                marginTop: '16px',
                padding: '8px 16px',
                backgroundColor: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Загрузить данные
            </button>
          </div>
        ) : aircraft.length > 0 ? (
          <>
            {/* Статистика воздушных судов */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
                Статистика воздушных судов
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{ 
                  padding: '24px', 
                  backgroundColor: '#f0f7ff', 
                  borderRadius: '12px', 
                  boxShadow: '0 4px 12px rgba(30, 58, 95, 0.15)',
                  border: '2px solid #1e3a5f',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(30, 58, 95, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(30, 58, 95, 0.15)';
                }}
                >
                  <div style={{ fontSize: '14px', color: '#1e3a5f', marginBottom: '8px', fontWeight: '500' }}>Всего ВС</div>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#1e3a5f' }}>
                    {computedStats.total.toLocaleString()}
                  </div>
                </div>
                <div style={{ 
                  padding: '24px', 
                  backgroundColor: '#e8f5e9', 
                  borderRadius: '12px', 
                  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.15)',
                  border: '2px solid #4caf50',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(76, 175, 80, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.15)';
                }}
                >
                  <div style={{ fontSize: '14px', color: '#2e7d32', marginBottom: '8px', fontWeight: '500' }}>Активных</div>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#4caf50' }}>
                    {computedStats.active.toLocaleString()}
                  </div>
                </div>
                <div style={{ 
                  padding: '24px', 
                  backgroundColor: '#fff3e0', 
                  borderRadius: '12px', 
                  boxShadow: '0 4px 12px rgba(255, 152, 0, 0.15)',
                  border: '2px solid #ff9800',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 152, 0, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 152, 0, 0.15)';
                }}
                >
                  <div style={{ fontSize: '14px', color: '#e65100', marginBottom: '8px', fontWeight: '500' }}>На обслуживании</div>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#ff9800' }}>
                    {computedStats.maintenance.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Статистика рисков */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
                Статистика рисков
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                <div style={{ 
                  padding: '24px', 
                  backgroundColor: '#f0f7ff', 
                  borderRadius: '12px', 
                  boxShadow: '0 4px 12px rgba(30, 58, 95, 0.15)',
                  border: '2px solid #1e3a5f',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(30, 58, 95, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(30, 58, 95, 0.15)';
                }}
                >
                  <div style={{ fontSize: '14px', color: '#1e3a5f', marginBottom: '8px', fontWeight: '500' }}>Всего рисков</div>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#1e3a5f' }}>
                    {risksStats.total}
                  </div>
                </div>
                <div style={{ 
                  padding: '24px', 
                  backgroundColor: '#ffebee', 
                  borderRadius: '12px', 
                  boxShadow: '0 4px 12px rgba(244, 67, 54, 0.15)',
                  border: '2px solid #f44336',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(244, 67, 54, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(244, 67, 54, 0.15)';
                }}
                >
                  <div style={{ fontSize: '14px', color: '#c62828', marginBottom: '8px', fontWeight: '500' }}>Критических</div>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#f44336' }}>
                    {risksStats.critical}
                  </div>
                </div>
                <div style={{ 
                  padding: '24px', 
                  backgroundColor: '#fff3e0', 
                  borderRadius: '12px', 
                  boxShadow: '0 4px 12px rgba(255, 152, 0, 0.15)',
                  border: '2px solid #ff9800',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 152, 0, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 152, 0, 0.15)';
                }}
                >
                  <div style={{ fontSize: '14px', color: '#e65100', marginBottom: '8px', fontWeight: '500' }}>Высоких</div>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#ff9800' }}>
                    {risksStats.high}
                  </div>
                </div>
              </div>
            </div>

            {/* Статистика аудитов */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
                Статистика аудитов
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                <div style={{ 
                  padding: '24px', 
                  backgroundColor: '#e3f2fd', 
                  borderRadius: '12px', 
                  boxShadow: '0 4px 12px rgba(33, 150, 243, 0.15)',
                  border: '2px solid #2196f3',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(33, 150, 243, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.15)';
                }}
                >
                  <div style={{ fontSize: '14px', color: '#1565c0', marginBottom: '8px', fontWeight: '500' }}>Текущих</div>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#2196f3' }}>
                    {auditsStats.current}
                  </div>
                </div>
                <div style={{ 
                  padding: '24px', 
                  backgroundColor: '#fff3e0', 
                  borderRadius: '12px', 
                  boxShadow: '0 4px 12px rgba(255, 152, 0, 0.15)',
                  border: '2px solid #ff9800',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 152, 0, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 152, 0, 0.15)';
                }}
                >
                  <div style={{ fontSize: '14px', color: '#e65100', marginBottom: '8px', fontWeight: '500' }}>Предстоящих</div>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#ff9800' }}>
                    {auditsStats.upcoming}
                  </div>
                </div>
                <div style={{ 
                  padding: '24px', 
                  backgroundColor: '#e8f5e9', 
                  borderRadius: '12px', 
                  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.15)',
                  border: '2px solid #4caf50',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(76, 175, 80, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.15)';
                }}
                >
                  <div style={{ fontSize: '14px', color: '#2e7d32', marginBottom: '8px', fontWeight: '500' }}>Завершённых</div>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#4caf50' }}>
                    {auditsStats.completed}
                  </div>
                </div>
              </div>
            </div>

            {/* Рейтинг операторов по КЛГ */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
                Рейтинг операторов по КЛГ
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {/* Лучшие по КЛГ */}
                <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#4caf50' }}>
                    Лучшие по КЛГ
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {operatorRatings
                      .filter(r => r.category === 'best')
                      .slice(0, 5)
                      .map((rating, index) => (
                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                          <span>{rating.operator}</span>
                          <span style={{ fontWeight: 'bold', color: '#4caf50' }}>{rating.rating}</span>
                        </div>
                      ))}
                    {operatorRatings.filter(r => r.category === 'best').length === 0 && (
                      <div style={{ fontSize: '14px', color: '#999' }}>Нет данных</div>
                    )}
                  </div>
                </div>

                {/* Средние */}
                <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#ff9800' }}>
                    Средние
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {operatorRatings
                      .filter(r => r.category === 'average')
                      .slice(0, 5)
                      .map((rating, index) => (
                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                          <span>{rating.operator}</span>
                          <span style={{ fontWeight: 'bold', color: '#ff9800' }}>{rating.rating}</span>
                        </div>
                      ))}
                    {operatorRatings.filter(r => r.category === 'average').length === 0 && (
                      <div style={{ fontSize: '14px', color: '#999' }}>Нет данных</div>
                    )}
                  </div>
                </div>

                {/* Требуют внимания */}
                <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#f44336' }}>
                    Требуют внимания
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {operatorRatings
                      .filter(r => r.category === 'worst')
                      .slice(0, 5)
                      .map((rating, index) => (
                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                          <span>{rating.operator}</span>
                          <span style={{ fontWeight: 'bold', color: '#f44336' }}>{rating.rating}</span>
                        </div>
                      ))}
                    {operatorRatings.filter(r => r.category === 'worst').length === 0 && (
                      <div style={{ fontSize: '14px', color: '#999' }}>Нет данных</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}

        {/* AI-Powered Knowledge System - показываем только если есть данные или не идет загрузка */}
        {(!isLoading && hasAnyData) && (
          <>
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
                Система знаний на основе ИИ
              </h3>
              <SemanticSearch
                onResultSelect={(result) => {
                  logInfo('Selected result', { result });
                  // Можно добавить навигацию к результату
                }}
                placeholder="Семантический поиск по базе знаний..."
              />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <AutonomousAgentInterface />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
                Визуализация графа знаний
              </h3>
              <KnowledgeGraphVisualization
                onNodeClick={(nodeId) => {
                  logInfo('Knowledge graph node clicked', { nodeId });
                  // Можно добавить навигацию к узлу
                }}
              />
            </div>
          </>
        )}

        {/* Модальные окна */}
        <AIAgentModal
          isOpen={isAIAgentModalOpen}
          onClose={() => setIsAIAgentModalOpen(false)}
        />
        <FileUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUpload={handleFileUpload}
        />
        <SearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
          aircraft={aircraft}
          searchType="dashboard"
          onNavigate={handleNavigate}
        />
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          data={aircraft}
          filename="aircraft-export"
          title="Экспорт воздушных судов"
          availableColumns={aircraft.length > 0 ? Object.keys(aircraft[0]) : []}
          columnLabels={{
            registrationNumber: 'Регистрационный номер',
            aircraftType: 'Тип ВС',
            operator: 'Оператор',
            status: 'Статус',
            manufacturer: 'Производитель',
            model: 'Модель',
          }}
        />
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
        />
      </div>
    </div>
  );
}
