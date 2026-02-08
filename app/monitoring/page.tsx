'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: { status: 'ok' | 'error'; message?: string };
    redis: { status: 'ok' | 'error'; message?: string };
    disk: { status: 'ok' | 'error'; message?: string; freeSpace?: number };
  };
  timestamp: string;
}

export default function MonitoringPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Обновление каждые 30 секунд
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [healthRes, metricsRes] = await Promise.all([
        fetch('/api/health').catch(err => {
          console.warn('[Monitoring] Ошибка загрузки health:', err);
          return { ok: false, json: async () => ({ status: 'unhealthy', checks: {}, timestamp: new Date() }) };
        }),
        fetch('/api/metrics?type=performance').catch(err => {
          console.warn('[Monitoring] Ошибка загрузки metrics:', err);
          return { ok: false, json: async () => ({ stats: { count: 0, avgDuration: 0, minDuration: 0, maxDuration: 0, errorRate: 0 } }) };
        }),
      ]);

      const healthData = await healthRes.json();
      const metricsData = await metricsRes.json();

      console.log('[Monitoring] Данные загружены:', { health: healthData.status, metrics: metricsData.stats?.count || 0 });
      setHealth(healthData);
      setMetrics(metricsData);
    } catch (error: any) {
      console.error('[Monitoring] Ошибка загрузки данных мониторинга:', error);
      setHealth(null);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'ok':
        return '#4caf50';
      case 'degraded':
        return '#ff9800';
      case 'unhealthy':
      case 'error':
        return '#f44336';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'Здоров';
      case 'degraded':
        return 'Работает (некритичные предупреждения)';
      case 'unhealthy':
        return 'Неисправен';
      default:
        return status;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
            Мониторинг системы
          </h1>
          <p style={{ fontSize: '16px', color: '#666' }}>
            Состояние системы и метрики производительности
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div>Загрузка данных мониторинга...</div>
          </div>
        ) : (
          <>
            {/* Health Status */}
            {health && (
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
                  Состояние системы
                </h2>
                <div
                  style={{
                    backgroundColor: 'white',
                    padding: '24px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    borderLeft: `4px solid ${getStatusColor(health.status)}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
                        Общий статус: {getStatusText(health.status)}
                      </div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        Последняя проверка: {new Date(health.timestamp).toLocaleString('ru-RU')}
                      </div>
                      {health.status === 'degraded' && (
                        <div style={{ fontSize: '12px', color: '#ff9800', marginTop: '4px' }}>
                          ⚠️ Система работает в режиме без БД/Redis (используются мок-данные)
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        padding: '8px 16px',
                        borderRadius: '4px',
                        backgroundColor: getStatusColor(health.status),
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 'bold',
                      }}
                    >
                      {health.status === 'degraded' ? 'DEGRADED' : health.status.toUpperCase()}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    {Object.entries(health.checks).map(([key, check]) => (
                      <div
                        key={key}
                        style={{
                          padding: '16px',
                          backgroundColor: '#f5f5f5',
                          borderRadius: '4px',
                          borderLeft: `3px solid ${getStatusColor(check.status)}`,
                        }}
                      >
                        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px', textTransform: 'capitalize' }}>
                          {key === 'database' ? 'База данных' : key === 'redis' ? 'Redis' : 'Диск'}
                        </div>
                        <div style={{ fontSize: '12px', color: check.status === 'ok' ? '#4caf50' : '#f44336' }}>
                          {check.status === 'ok' ? '✓ Работает' : `✗ Ошибка: ${check.message || 'Неизвестная ошибка'}`}
                        </div>
                        {'freeSpace' in check && check.freeSpace !== undefined && (
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            Свободно: {check.freeSpace}%
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Performance Metrics */}
            {metrics && metrics.stats && (
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
                  Метрики производительности
                </h2>
                <div
                  style={{
                    backgroundColor: 'white',
                    padding: '24px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div style={{ padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                      <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Всего запросов</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{metrics.stats.count}</div>
                    </div>
                    <div style={{ padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                      <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Среднее время ответа</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                        {metrics.stats.avgDuration.toFixed(0)}ms
                      </div>
                    </div>
                    <div style={{ padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                      <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Минимальное время</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{metrics.stats.minDuration}ms</div>
                    </div>
                    <div style={{ padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                      <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Максимальное время</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{metrics.stats.maxDuration}ms</div>
                    </div>
                    <div style={{ padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                      <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Процент ошибок</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: metrics.stats.errorRate > 0.1 ? '#f44336' : '#4caf50' }}>
                        {(metrics.stats.errorRate * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
