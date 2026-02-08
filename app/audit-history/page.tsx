'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Logo from '@/components/Logo';
import Pagination from '@/components/Pagination';

interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export default function AuditHistoryPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    action: '',
    resourceType: '',
    search: '',
    startDate: '',
    endDate: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: ((currentPage - 1) * pageSize).toString(),
      });

      if (filters.action) {
        params.append('action', filters.action);
      }
      if (filters.resourceType) {
        params.append('resourceType', filters.resourceType);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate);
      }

      const response = await fetch(`/api/audit?${params.toString()}`);
      const data = await response.json();
      
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Ошибка загрузки истории аудита:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const params = new URLSearchParams({
        format,
        limit: '10000',
      });

      if (filters.action) {
        params.append('action', filters.action);
      }
      if (filters.resourceType) {
        params.append('resourceType', filters.resourceType);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate);
      }

      const response = await fetch(`/api/audit?${params.toString()}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Ошибка экспорта:', error);
      alert('Ошибка экспорта логов');
    }
  };

  const handleRollback = async (logId: string) => {
    if (!confirm('Вы уверены, что хотите откатить это изменение?')) {
      return;
    }

    try {
      const response = await fetch('/api/audit/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditLogId: logId }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Изменения успешно откачены');
        loadLogs();
      } else {
        alert(data.error || 'Ошибка при откате изменений');
      }
    } catch (error) {
      console.error('Ошибка отката:', error);
      alert('Ошибка при откате изменений');
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return '#4caf50';
      case 'UPDATE': return '#2196f3';
      case 'DELETE': return '#f44336';
      case 'VIEW': return '#9e9e9e';
      case 'EXPORT': return '#ff9800';
      case 'ROLLBACK': return '#9c27b0';
      default: return '#666';
    }
  };

  const getResourceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      aircraft: 'Воздушное судно',
      risk: 'Риск',
      organization: 'Организация',
      user: 'Пользователь',
      audit: 'Аудит',
      checklist: 'Чек-лист',
      application: 'Заявка',
      document: 'Документ',
    };
    return labels[type] || type;
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
              История изменений
            </h2>
            <p style={{ fontSize: '14px', color: '#666' }}>
              Аудит всех действий пользователей в системе
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleExport('csv')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Экспорт CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Экспорт JSON
            </button>
          </div>
        </div>

        {/* Фильтры */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '24px',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Действие
              </label>
              <select
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <option value="">Все</option>
                <option value="CREATE">Создание</option>
                <option value="UPDATE">Изменение</option>
                <option value="DELETE">Удаление</option>
                <option value="VIEW">Просмотр</option>
                <option value="EXPORT">Экспорт</option>
                <option value="ROLLBACK">Откат</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Тип ресурса
              </label>
              <select
                value={filters.resourceType}
                onChange={(e) => setFilters({ ...filters, resourceType: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <option value="">Все</option>
                <option value="aircraft">Воздушное судно</option>
                <option value="risk">Риск</option>
                <option value="organization">Организация</option>
                <option value="user">Пользователь</option>
                <option value="audit">Аудит</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Поиск
              </label>
              <input
                type="text"
                placeholder="Пользователь, действие, IP..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Дата с
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Дата по
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
            </div>
          </div>
        </div>

        {/* Таблица логов */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div>Загрузка истории изменений...</div>
          </div>
        ) : logs.length === 0 ? (
          <div style={{
            backgroundColor: '#e3f2fd',
            padding: '40px',
            borderRadius: '8px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
              Записи не найдены
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              Попробуйте изменить фильтры
            </div>
          </div>
        ) : (
          <>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              marginBottom: '24px',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold' }}>Дата</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold' }}>Пользователь</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold' }}>Действие</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold' }}>Ресурс</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold' }}>IP адрес</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold' }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} style={{ borderTop: '1px solid #e0e0e0' }}>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        {new Date(log.createdAt).toLocaleString('ru-RU')}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        {log.userName || 'Система'}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          backgroundColor: getActionColor(log.action),
                          color: 'white',
                        }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        {getResourceTypeLabel(log.resourceType)} ({log.resourceId.slice(0, 8)}...)
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        {log.ipAddress || '-'}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              // Показать детали изменения
                              const details = (log.oldValues || log.newValues) 
                                ? `Старые значения: ${JSON.stringify(log.oldValues || {}, null, 2)}\n\nНовые значения: ${JSON.stringify(log.newValues || {}, null, 2)}`
                                : 'Нет деталей';
                              alert(details);
                            }}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#2196f3',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                            }}
                          >
                            Детали
                          </button>
                          {log.action === 'UPDATE' && log.oldValues && (
                            <button
                              onClick={() => handleRollback(log.id)}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#9c27b0',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                              }}
                            >
                              Откатить
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          <Pagination
            currentPage={currentPage}
            total={total}
            limit={pageSize}
            onPageChange={setCurrentPage}
          />
          </>
        )}
      </div>
    </div>
  );
}
